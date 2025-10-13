# Forgot Password Feature - Implementation Guide

## Overview

This document describes the complete, production-grade "Forgot Password" feature implementation for the Fashion Designer App API. The feature follows industry best practices for security, user experience, and error handling.

## Architecture

The forgot password flow consists of three main steps:

1. **Request Password Reset** - User requests a reset code
2. **Verify Reset Code** - User verifies the code (optional step for better UX)
3. **Reset Password** - User sets a new password

## Security Features

### Token Management
- **6-digit numeric codes** for better user experience (vs long URLs)
- **Hashed tokens** stored in database using bcrypt
- **15-minute expiration** for security
- **Single-use tokens** - automatically deleted after use
- **Token invalidation** - old tokens deleted when new ones are requested

### Password Security
- **Strong password requirements**: minimum 6 characters, uppercase, lowercase, number, special character
- **Password history check**: prevents reusing current password
- **Bcrypt hashing** with salt rounds for secure storage

### Rate Limiting
- **5 requests per 15 minutes** per IP for forgot-password endpoint
- Prevents brute force attacks and abuse

### Email Verification Requirement
- Only verified email accounts can reset passwords
- Prevents unauthorized password resets

## API Endpoints

### 1. Request Password Reset

**Endpoint**: `POST /api/auth/forgot-password`

**Request Body**:
```json
{
  "email": "admin@example.com"
}
```

**Success Response** (200):
```json
{
  "message": "Password reset code has been sent to your email. Please check your inbox."
}
```

**Error Responses**:
- `400` - Validation errors
- `403` - Email not verified
- `404` - Admin not found
- `429` - Too many requests
- `500` - Server error or email sending failed

**Security Notes**:
- Returns generic success message even if email doesn't exist (prevents email enumeration)
- Rate limited to prevent abuse
- Invalidates any existing reset tokens

---

### 2. Verify Reset Code (Optional)

**Endpoint**: `POST /api/auth/verify-reset-code`

**Request Body**:
```json
{
  "email": "admin@example.com",
  "resetCode": "123456"
}
```

**Success Response** (200):
```json
{
  "message": "Reset code verified successfully. You can now reset your password.",
  "verified": true
}
```

**Error Responses**:
- `400` - Validation errors, invalid code, or expired token
- `404` - Admin not found or no active reset code
- `500` - Server error

**Use Case**:
- Optional step for better UX
- Allows frontend to validate code before showing password input
- Provides immediate feedback to user

---

### 3. Reset Password

**Endpoint**: `POST /api/auth/reset-password`

**Request Body**:
```json
{
  "email": "admin@example.com",
  "resetCode": "123456",
  "newPassword": "NewPassword123!"
}
```

**Success Response** (200):
```json
{
  "message": "Password reset successful. You can now log in with your new password."
}
```

**Error Responses**:
- `400` - Validation errors, invalid code, expired token, or password same as current
- `404` - Admin not found or no active reset code
- `500` - Server error

**Security Features**:
- Validates reset code again
- Checks token expiration
- Prevents reusing current password
- Deletes token after successful reset
- Sends confirmation email

---

## Email Templates

### 1. Password Reset Request Email
**Template**: `templates/emails/forgot-password.ejs`

**Content**:
- Professional branded header
- Clear instructions
- Large, prominent 6-digit code
- Expiration warning (15 minutes)
- Security notice for unauthorized requests

### 2. Password Reset Success Email
**Template**: `templates/emails/password-reset-success.ejs`

**Content**:
- Confirmation of successful password change
- Security alert if change was unauthorized
- Call-to-action button to log in

---

## Database Schema

The feature uses the existing `VerificationToken` model with `TokenType.PASSWORD_RESET`:

```prisma
model VerificationToken {
  id        String    @id @default(cuid())
  token     String    @unique // Hashed reset code
  type      TokenType // PASSWORD_RESET
  email     String
  adminId   String?
  expiresAt DateTime
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  admin Admin? @relation(fields: [adminId], references: [id], onDelete: Cascade)
  
  @@index([email, type])
  @@index([adminId])
}

enum TokenType {
  EMAIL_VERIFICATION
  PASSWORD_RESET
}
```

---

## Error Handling

### User-Friendly Error Messages

All errors return clear, actionable messages:

```javascript
// Email not found
"No account found with this email address."

// Email not verified
"Email not verified. Please verify your email before resetting password."

// Invalid code
"The reset code is incorrect. Please try again."

// Expired code
"Your reset code has expired. Please request a new password reset."

// No active token
"No active reset code found. Please request a new password reset."

// Same password
"New password must be different from your current password."
```

### Error Logging

All errors are logged server-side for monitoring:

```javascript
console.error('Error during forgot password:', error);
console.error('Error during reset code verification:', error);
console.error('Error during password reset:', error);
```

---

## Frontend Integration Guide

### Complete Flow Example

```javascript
// Step 1: Request password reset
async function requestPasswordReset(email) {
  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Show success message and code input form
      showMessage(data.message);
      showCodeInputForm();
    } else {
      // Handle errors
      showError(data.message);
    }
  } catch (error) {
    showError('Network error. Please try again.');
  }
}

// Step 2: Verify reset code (optional)
async function verifyResetCode(email, resetCode) {
  try {
    const response = await fetch('/api/auth/verify-reset-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, resetCode })
    });
    
    const data = await response.json();
    
    if (response.ok && data.verified) {
      // Show password input form
      showPasswordInputForm();
    } else {
      showError(data.message);
    }
  } catch (error) {
    showError('Network error. Please try again.');
  }
}

// Step 3: Reset password
async function resetPassword(email, resetCode, newPassword) {
  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, resetCode, newPassword })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Show success message and redirect to login
      showMessage(data.message);
      redirectToLogin();
    } else {
      showError(data.message);
    }
  } catch (error) {
    showError('Network error. Please try again.');
  }
}
```

### Recommended UX Flow

1. **Forgot Password Page**
   - Email input field
   - Submit button
   - Link back to login

2. **Enter Code Page**
   - 6-digit code input (can use separate inputs for each digit)
   - Resend code button (calls forgot-password again)
   - Timer showing code expiration (15 minutes)
   - Optional: Auto-verify on 6th digit entry

3. **New Password Page**
   - New password input with strength indicator
   - Confirm password input
   - Password requirements display
   - Submit button

4. **Success Page**
   - Success message
   - Auto-redirect to login after 3 seconds
   - Manual "Go to Login" button

---

## Testing

### Manual Testing Checklist

- [ ] Request reset code with valid email
- [ ] Request reset code with non-existent email
- [ ] Request reset code with unverified email
- [ ] Verify code with correct code
- [ ] Verify code with incorrect code
- [ ] Verify code after expiration (wait 15+ minutes)
- [ ] Reset password with valid code and password
- [ ] Reset password with same password as current
- [ ] Reset password with weak password
- [ ] Reset password after token expiration
- [ ] Check rate limiting (6+ requests in 15 minutes)
- [ ] Verify email delivery for all scenarios
- [ ] Test token invalidation when requesting new code

### Example Test Cases

```javascript
// Test 1: Successful password reset flow
POST /api/auth/forgot-password
{ "email": "test@example.com" }
// Expected: 200, reset code sent

POST /api/auth/verify-reset-code
{ "email": "test@example.com", "resetCode": "123456" }
// Expected: 200, verified: true

POST /api/auth/reset-password
{ "email": "test@example.com", "resetCode": "123456", "newPassword": "NewPass123!" }
// Expected: 200, password reset successful

// Test 2: Invalid code
POST /api/auth/verify-reset-code
{ "email": "test@example.com", "resetCode": "999999" }
// Expected: 400, "The reset code is incorrect"

// Test 3: Expired token
// Wait 16 minutes after requesting code
POST /api/auth/reset-password
{ "email": "test@example.com", "resetCode": "123456", "newPassword": "NewPass123!" }
// Expected: 400, "Your reset code has expired"
```

---

## Monitoring & Maintenance

### Metrics to Track

1. **Password Reset Requests**
   - Total requests per day
   - Success rate
   - Failed attempts (invalid email, unverified email)

2. **Code Verification**
   - Verification attempts
   - Success rate
   - Invalid code attempts (potential security issue)

3. **Password Resets**
   - Successful resets per day
   - Failed resets (expired tokens, invalid codes)

4. **Email Delivery**
   - Email send success rate
   - Email delivery failures

### Cleanup Tasks

The system automatically cleans up expired tokens, but you may want to add a cron job for additional cleanup:

```javascript
// Clean up expired tokens daily
cron.schedule('0 0 * * *', async () => {
  await prisma.verificationToken.deleteMany({
    where: {
      type: 'PASSWORD_RESET',
      expiresAt: { lt: new Date() }
    }
  });
});
```

---

## Security Considerations

### Best Practices Implemented

1. ✅ **Token Hashing**: All tokens stored as bcrypt hashes
2. ✅ **Short Expiration**: 15-minute token lifetime
3. ✅ **Single Use**: Tokens deleted after successful use
4. ✅ **Rate Limiting**: Prevents brute force attacks
5. ✅ **Email Verification**: Only verified accounts can reset
6. ✅ **Strong Passwords**: Enforced password complexity
7. ✅ **Password History**: Prevents reusing current password
8. ✅ **Secure Communication**: All endpoints use HTTPS (in production)
9. ✅ **No Email Enumeration**: Generic error messages
10. ✅ **Audit Trail**: All actions logged

### Additional Security Recommendations

1. **Account Lockout**: Consider locking account after multiple failed reset attempts
2. **2FA Integration**: Add two-factor authentication for sensitive operations
3. **IP Tracking**: Log IP addresses for security audits
4. **Notification Emails**: Send alerts for all password changes
5. **Session Invalidation**: Invalidate all active sessions after password reset

---

## Troubleshooting

### Common Issues

**Issue**: Emails not being received
- Check email service configuration in `.env`
- Verify SMTP credentials
- Check spam/junk folders
- Review email service logs

**Issue**: "Token expired" errors immediately
- Check server time synchronization
- Verify timezone settings
- Review token expiration calculation

**Issue**: Rate limiting too aggressive
- Adjust rate limit settings in `rateLimitMiddleware.js`
- Consider per-user vs per-IP limits

**Issue**: Password validation failing
- Review password regex pattern
- Check for special character encoding issues
- Verify frontend validation matches backend

---

## Configuration

### Environment Variables

```env
# Required for JWT token generation
JWT_SECRET=your-secret-key-here

# Email service configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Optional: Customize token expiration (in milliseconds)
PASSWORD_RESET_TOKEN_EXPIRY=900000  # 15 minutes
```

### Customization Options

**Token Expiration**: Modify in `authService.js`
```javascript
const tokenExpiresIn = 15 * 60 * 1000; // Change to desired duration
```

**Code Length**: Modify in `authService.js`
```javascript
const resetCode = crypto.randomInt(100000, 999999).toString(); // 6 digits
// For 8 digits: crypto.randomInt(10000000, 99999999).toString()
```

**Rate Limits**: Modify in `rateLimitMiddleware.js`
```javascript
const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Change to desired limit
});
```

---

## Support

For issues or questions:
- Check the [API Documentation](http://localhost:5000/api-docs)
- Review server logs for detailed error messages
- Contact: support@yourfashionapp.com

---

## Changelog

### Version 1.0.0 (Current)
- Initial implementation of forgot password feature
- 6-digit code-based reset flow
- Email notifications
- Rate limiting
- Comprehensive error handling
- Swagger documentation
