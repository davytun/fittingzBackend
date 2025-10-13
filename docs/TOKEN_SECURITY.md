# Token Security - Single-Use Reset Codes

## 🔒 Security Implementation

The forgot password feature implements **single-use tokens** to prevent security vulnerabilities. Once a reset code is used to successfully reset a password, it is **immediately and permanently invalidated**.

---

## 🎯 Key Security Features

### 1. Token Lifecycle

```
Token Created → Token Used → Token DELETED
     ↓              ↓              ↓
  15 min TTL    Password     No longer
                 Reset        exists
```

### 2. Single-Use Guarantee

**After a successful password reset:**
- ✅ Token is **deleted from database**
- ✅ Same code **cannot be reused**
- ✅ Verification attempts **will fail**
- ✅ Reset attempts **will fail**

### 3. Atomic Operation

The password update and token deletion happen in a **database transaction**:

```javascript
await prisma.$transaction([
  prisma.admin.update({ /* update password */ }),
  prisma.verificationToken.delete({ /* delete token */ })
]);
```

This ensures:
- Both operations succeed together, or
- Both operations fail together
- No partial state possible

---

## 🧪 Testing Token Expiration

### Test 1: Token Reuse Prevention

```bash
node test-token-expiration.js expiration
```

**Expected Behavior:**
1. ✅ First password reset succeeds
2. ✅ Second attempt with same code fails
3. ✅ Error: "No active reset code found"

### Test 2: Verify-Then-Reset Flow

```bash
node test-token-expiration.js verify-flow
```

**Expected Behavior:**
1. ✅ Verify code succeeds (token NOT deleted)
2. ✅ Reset password succeeds (token deleted)
3. ✅ Token only deleted after password reset

---

## 🔐 Security Scenarios

### Scenario 1: Attacker Intercepts Code

**Timeline:**
1. User requests password reset
2. Attacker intercepts email and gets code
3. User resets password first ✅
4. Attacker tries to use code ❌ **FAILS**

**Result:** Token already deleted, attacker cannot use it.

---

### Scenario 2: User Resets Twice

**Timeline:**
1. User requests password reset
2. User resets password successfully ✅
3. User tries to use same code again ❌ **FAILS**

**Result:** Token deleted after first use, cannot be reused.

---

### Scenario 3: Verify Then Reset

**Timeline:**
1. User requests password reset
2. User verifies code ✅ (token still exists)
3. User resets password ✅ (token deleted)
4. User tries to verify again ❌ **FAILS**

**Result:** Token persists through verification but deleted after reset.

---

### Scenario 4: Multiple Reset Requests

**Timeline:**
1. User requests password reset (Code: 123456)
2. User requests another reset (Code: 789012)
3. Old code (123456) is **invalidated**
4. Only new code (789012) works

**Result:** New request invalidates all previous tokens.

---

## 📊 Token States

### State Diagram

```
┌─────────────┐
│   CREATED   │ ← Token generated and saved
└──────┬──────┘
       │
       ├─→ [15 minutes pass] → EXPIRED → Deleted
       │
       ├─→ [New request] → INVALIDATED → Deleted
       │
       └─→ [Password reset] → USED → Deleted
```

### Database State

**Before Password Reset:**
```sql
SELECT * FROM "VerificationToken" 
WHERE email = 'user@example.com' 
AND type = 'PASSWORD_RESET';

-- Result: 1 row (token exists)
```

**After Password Reset:**
```sql
SELECT * FROM "VerificationToken" 
WHERE email = 'user@example.com' 
AND type = 'PASSWORD_RESET';

-- Result: 0 rows (token deleted)
```

---

## 🛡️ Security Best Practices Implemented

### 1. Token Hashing
- ✅ Tokens stored as bcrypt hashes
- ✅ Plain text never stored in database
- ✅ Rainbow table attacks prevented

### 2. Time-Limited Tokens
- ✅ 15-minute expiration
- ✅ Expired tokens auto-deleted
- ✅ Reduces attack window

### 3. Single-Use Tokens
- ✅ Deleted after successful use
- ✅ Cannot be replayed
- ✅ Prevents token reuse attacks

### 4. Token Invalidation
- ✅ Old tokens deleted on new request
- ✅ Only latest token valid
- ✅ Prevents multiple active tokens

### 5. Atomic Operations
- ✅ Transaction-based updates
- ✅ No partial state
- ✅ Data consistency guaranteed

### 6. Rate Limiting
- ✅ 5 requests per 15 minutes
- ✅ Prevents brute force
- ✅ Prevents token flooding

---

## 🔍 Code Implementation

### Token Deletion in resetPassword()

```javascript
async resetPassword({ email, resetCode, newPassword }) {
  // ... validation code ...

  // Atomic operation: Update password AND delete token
  await prisma.$transaction([
    prisma.admin.update({
      where: { email: email },
      data: { password: hashedPassword },
    }),
    prisma.verificationToken.delete({
      where: { id: resetTokenRecord.id },
    }),
  ]);

  // Token is now permanently deleted
  // Cannot be reused
}
```

### Token Preservation in verifyResetCode()

```javascript
async verifyResetCode({ email, resetCode }) {
  // ... validation code ...

  // Note: Token is NOT deleted here
  // This allows the subsequent password reset to use it
  return {
    message: "Reset code verified successfully.",
    verified: true,
  };
}
```

---

## 📈 Security Metrics

### Token Lifecycle Metrics

| Metric | Value | Description |
|--------|-------|-------------|
| Token TTL | 15 minutes | Time before expiration |
| Max Uses | 1 | Single-use only |
| Hash Algorithm | bcrypt | Secure hashing |
| Hash Rounds | 10 | Salt rounds |
| Rate Limit | 5/15min | Request throttling |

### Attack Prevention

| Attack Type | Prevention Method | Status |
|-------------|-------------------|--------|
| Token Reuse | Single-use deletion | ✅ Protected |
| Token Replay | Immediate deletion | ✅ Protected |
| Brute Force | Rate limiting | ✅ Protected |
| Token Flooding | Old token invalidation | ✅ Protected |
| Rainbow Tables | Bcrypt hashing | ✅ Protected |
| Timing Attacks | Constant-time comparison | ✅ Protected |

---

## 🧪 Manual Testing

### Test Token Deletion

1. **Request reset code:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

2. **Reset password (first time):**
   ```bash
   curl -X POST http://localhost:5000/api/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{
       "email":"test@example.com",
       "resetCode":"123456",
       "newPassword":"NewPass123!"
     }'
   ```
   **Expected:** Success ✅

3. **Try to reset again (same code):**
   ```bash
   curl -X POST http://localhost:5000/api/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{
       "email":"test@example.com",
       "resetCode":"123456",
       "newPassword":"AnotherPass456!"
     }'
   ```
   **Expected:** Error ❌ "No active reset code found"

---

## 🔄 Token Invalidation Scenarios

### Scenario Matrix

| Action | Token State | Can Verify? | Can Reset? |
|--------|-------------|-------------|------------|
| Just created | Active | ✅ Yes | ✅ Yes |
| After verify | Active | ✅ Yes | ✅ Yes |
| After reset | Deleted | ❌ No | ❌ No |
| After 15 min | Expired | ❌ No | ❌ No |
| New request | Invalidated | ❌ No | ❌ No |

---

## 📝 Error Messages

### Token-Related Errors

```javascript
// Token not found (deleted after use)
"No active reset code found. Please request a new password reset."

// Token expired (15 minutes passed)
"Your reset code has expired. Please request a new password reset."

// Invalid code (wrong code entered)
"The reset code is incorrect. Please try again."
```

---

## 🎯 Summary

### What Happens After Password Reset

1. ✅ Password is updated in database
2. ✅ Token is **permanently deleted**
3. ✅ Confirmation email sent
4. ✅ User can login with new password
5. ✅ Old token **cannot be reused**

### Security Guarantees

- 🔒 **Single-use tokens** - Cannot be reused
- 🔒 **Atomic operations** - No partial state
- 🔒 **Immediate deletion** - No delay
- 🔒 **Transaction safety** - All or nothing
- 🔒 **No token leakage** - Properly cleaned up

---

## 🆘 Troubleshooting

### Issue: "No active reset code found" immediately

**Possible Causes:**
1. Token was already used
2. Token expired (15 minutes)
3. New reset request invalidated old token

**Solution:**
Request a new password reset code.

### Issue: Token seems to work multiple times

**This should NOT happen!** If it does:
1. Check database for token deletion
2. Review transaction implementation
3. Check for race conditions
4. Verify test environment

---

## 📚 Related Documentation

- **[Implementation Guide](FORGOT_PASSWORD_GUIDE.md)** - Complete feature documentation
- **[Security Features](FORGOT_PASSWORD_GUIDE.md#security-features)** - Detailed security info
- **[Test Script](test-token-expiration.js)** - Automated security tests

---

## ✅ Security Checklist

- [x] Tokens are hashed before storage
- [x] Tokens expire after 15 minutes
- [x] Tokens are single-use only
- [x] Tokens deleted after successful reset
- [x] Old tokens invalidated on new request
- [x] Atomic transaction for updates
- [x] Rate limiting implemented
- [x] No token reuse possible
- [x] Proper error messages
- [x] Security tests provided

---

**Status:** ✅ **SECURE - Single-use tokens properly implemented**

**Last Updated:** 2024
**Security Level:** Production-Grade
