# Forgot Password - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Server running (`pnpm dev`)
- Email service configured in `.env`
- Test admin account with verified email

---

## 📋 Quick Test

### 1. Request Password Reset
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin@example.com"}'
```

**Expected Response:**
```json
{
  "message": "Password reset code has been sent to your email. Please check your inbox."
}
```

### 2. Check Your Email
- Open your email inbox
- Find the email with subject "Password Reset Request"
- Copy the 6-digit code

### 3. Verify Reset Code (Optional)
```bash
curl -X POST http://localhost:5000/api/auth/verify-reset-code \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin@example.com","resetCode":"123456"}'
```

**Expected Response:**
```json
{
  "message": "Reset code verified successfully. You can now reset your password.",
  "verified": true
}
```

### 4. Reset Password
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email":"your-admin@example.com",
    "resetCode":"123456",
    "newPassword":"NewPassword123!"
  }'
```

**Expected Response:**
```json
{
  "message": "Password reset successful. You can now log in with your new password."
}
```

### 5. Login with New Password
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"your-admin@example.com",
    "password":"NewPassword123!"
  }'
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "...",
    "email": "your-admin@example.com",
    "businessName": "..."
  }
}
```

---

## 🧪 Using the Test Script

### Run Full Test Flow
```bash
node test-forgot-password.js
```

Follow the prompts to enter the reset code from your email.

### Test Specific Scenarios
```bash
# Test with invalid email
node test-forgot-password.js invalid-email

# Test with invalid code
node test-forgot-password.js invalid-code

# Test with weak password
node test-forgot-password.js weak-password
```

---

## 🌐 Using Swagger UI

1. Start the server: `pnpm dev`
2. Open browser: `http://localhost:5000/api-docs`
3. Navigate to "Authentication" section
4. Try the endpoints:
   - `/api/auth/forgot-password`
   - `/api/auth/verify-reset-code`
   - `/api/auth/reset-password`

---

## 🎨 Frontend Integration Example

### React/Next.js Example

```javascript
// Step 1: Request password reset
const handleForgotPassword = async (email) => {
  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      setMessage(data.message);
      setStep('verify-code');
    } else {
      setError(data.message);
    }
  } catch (error) {
    setError('Network error. Please try again.');
  }
};

// Step 2: Verify code (optional)
const handleVerifyCode = async (email, resetCode) => {
  try {
    const response = await fetch('/api/auth/verify-reset-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, resetCode })
    });
    
    const data = await response.json();
    
    if (response.ok && data.verified) {
      setStep('reset-password');
    } else {
      setError(data.message);
    }
  } catch (error) {
    setError('Network error. Please try again.');
  }
};

// Step 3: Reset password
const handleResetPassword = async (email, resetCode, newPassword) => {
  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, resetCode, newPassword })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      setMessage(data.message);
      setTimeout(() => router.push('/login'), 3000);
    } else {
      setError(data.message);
    }
  } catch (error) {
    setError('Network error. Please try again.');
  }
};
```

---

## ⚠️ Common Issues & Solutions

### Issue: Email not received
**Solution:**
- Check spam/junk folder
- Verify email service configuration in `.env`
- Check server logs for email sending errors

### Issue: "Token expired" error
**Solution:**
- Request a new reset code (15-minute expiration)
- Check server time synchronization

### Issue: "Invalid reset code"
**Solution:**
- Double-check the code from email
- Ensure no extra spaces
- Request a new code if needed

### Issue: "Password validation failed"
**Solution:**
- Password must be at least 6 characters
- Must include: uppercase, lowercase, number, special character
- Example: `Password123!`

### Issue: Rate limit exceeded
**Solution:**
- Wait 15 minutes before trying again
- Default limit: 5 requests per 15 minutes

---

## 📊 Password Requirements

✅ Minimum 6 characters
✅ At least one uppercase letter (A-Z)
✅ At least one lowercase letter (a-z)
✅ At least one number (0-9)
✅ At least one special character (@$!%*?&)

**Valid Examples:**
- `Password123!`
- `MyP@ssw0rd`
- `Secure123$`

**Invalid Examples:**
- `password` (no uppercase, number, or special char)
- `PASSWORD123` (no lowercase or special char)
- `Pass1!` (too short)

---

## 🔒 Security Notes

- Reset codes expire after 15 minutes
- Codes are single-use (deleted after successful reset)
- Old codes are invalidated when new ones are requested
- Rate limiting prevents brute force attacks
- All tokens are hashed in the database
- Email verification required before password reset

---

## 📚 Additional Resources

- **Full Documentation**: [FORGOT_PASSWORD_GUIDE.md](FORGOT_PASSWORD_GUIDE.md)
- **Implementation Summary**: [FORGOT_PASSWORD_SUMMARY.md](FORGOT_PASSWORD_SUMMARY.md)
- **API Documentation**: http://localhost:5000/api-docs
- **Main README**: [README.md](README.md)

---

## 🆘 Need Help?

1. Check the [Full Guide](FORGOT_PASSWORD_GUIDE.md) for detailed information
2. Review server logs for error details
3. Test with Swagger UI for interactive debugging
4. Verify email service configuration

---

## ✅ Checklist

Before going to production:

- [ ] Email service configured and tested
- [ ] Environment variables set correctly
- [ ] Test all three endpoints
- [ ] Verify email delivery
- [ ] Test rate limiting
- [ ] Check error handling
- [ ] Review security settings
- [ ] Test with real email addresses
- [ ] Verify password requirements
- [ ] Test token expiration

---

**Ready to use!** 🎉

For any issues, refer to the comprehensive [FORGOT_PASSWORD_GUIDE.md](FORGOT_PASSWORD_GUIDE.md).
