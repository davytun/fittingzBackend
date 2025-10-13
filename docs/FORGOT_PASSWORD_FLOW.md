# Forgot Password Flow Diagram

## Complete Flow Visualization

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FORGOT PASSWORD FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

┌──────────┐
│  USER    │
└────┬─────┘
     │
     │ 1. Clicks "Forgot Password"
     │
     ▼
┌─────────────────────────────────────┐
│  Frontend: Forgot Password Page     │
│  - Email input field                │
│  - Submit button                    │
└────────────┬────────────────────────┘
             │
             │ 2. POST /api/auth/forgot-password
             │    { email: "user@example.com" }
             ▼
┌─────────────────────────────────────┐
│  Backend: authController            │
│  - Validate email format            │
│  - Check rate limiting              │
└────────────┬────────────────────────┘
             │
             │ 3. Call forgotPassword()
             ▼
┌─────────────────────────────────────┐
│  Backend: authService               │
│  - Find admin by email              │
│  - Check email verified             │
│  - Generate 6-digit code            │
│  - Hash code with bcrypt            │
│  - Delete old reset tokens          │
│  - Save new token to DB             │
└────────────┬────────────────────────┘
             │
             │ 4. Send email
             ▼
┌─────────────────────────────────────┐
│  Email Service                      │
│  - Render email template            │
│  - Send via SMTP                    │
│  - Include 6-digit code             │
└────────────┬────────────────────────┘
             │
             │ 5. Email delivered
             ▼
┌─────────────────────────────────────┐
│  User's Email Inbox                 │
│  Subject: "Password Reset Request"  │
│  Code: 123456                       │
│  Expires: 15 minutes                │
└────────────┬────────────────────────┘
             │
             │ 6. User copies code
             ▼
┌─────────────────────────────────────┐
│  Frontend: Enter Code Page          │
│  - 6-digit code input               │
│  - Verify button (optional)         │
│  - Resend code link                 │
└────────────┬────────────────────────┘
             │
             │ 7. POST /api/auth/verify-reset-code (Optional)
             │    { email, resetCode }
             ▼
┌─────────────────────────────────────┐
│  Backend: Verify Code               │
│  - Find token by email              │
│  - Check expiration                 │
│  - Compare hashed code              │
│  - Return verified: true            │
└────────────┬────────────────────────┘
             │
             │ 8. Code verified ✓
             ▼
┌─────────────────────────────────────┐
│  Frontend: New Password Page        │
│  - New password input               │
│  - Confirm password input           │
│  - Password strength indicator      │
│  - Submit button                    │
└────────────┬────────────────────────┘
             │
             │ 9. POST /api/auth/reset-password
             │    { email, resetCode, newPassword }
             ▼
┌─────────────────────────────────────┐
│  Backend: Reset Password            │
│  - Verify code again                │
│  - Check token expiration           │
│  - Validate password strength       │
│  - Check not same as current        │
│  - Hash new password                │
│  - Update admin password            │
│  - Delete used token                │
└────────────┬────────────────────────┘
             │
             │ 10. Send confirmation email
             ▼
┌─────────────────────────────────────┐
│  Email Service                      │
│  - Send success confirmation        │
│  - Security alert included          │
└────────────┬────────────────────────┘
             │
             │ 11. Password reset successful
             ▼
┌─────────────────────────────────────┐
│  Frontend: Success Page             │
│  - Success message                  │
│  - Redirect to login (3 seconds)    │
│  - "Go to Login" button             │
└────────────┬────────────────────────┘
             │
             │ 12. User logs in with new password
             ▼
┌─────────────────────────────────────┐
│  POST /api/auth/login               │
│  { email, password: newPassword }   │
└────────────┬────────────────────────┘
             │
             │ 13. Login successful ✓
             ▼
┌─────────────────────────────────────┐
│  User Dashboard                     │
└─────────────────────────────────────┘
```

---

## Security Checkpoints

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                          │
└─────────────────────────────────────────────────────────────┘

Request Password Reset
├─ ✓ Rate Limiting (5 req/15min)
├─ ✓ Email Format Validation
├─ ✓ Email Verification Check
├─ ✓ Token Hashing (bcrypt)
└─ ✓ Old Token Invalidation

Verify Reset Code
├─ ✓ Token Existence Check
├─ ✓ Expiration Check (15 min)
├─ ✓ Code Comparison (bcrypt)
└─ ✓ Generic Error Messages

Reset Password
├─ ✓ Token Re-verification
├─ ✓ Expiration Re-check
├─ ✓ Password Strength Validation
├─ ✓ Password History Check
├─ ✓ Secure Password Hashing
└─ ✓ Token Deletion After Use
```

---

## Database State Changes

```
┌─────────────────────────────────────────────────────────────┐
│                DATABASE STATE FLOW                          │
└─────────────────────────────────────────────────────────────┘

Initial State:
┌──────────────────────────────────────┐
│ Admin Table                          │
├──────────────────────────────────────┤
│ id: "abc123"                         │
│ email: "user@example.com"            │
│ password: "$2b$10$oldHashedPassword" │
│ isEmailVerified: true                │
└──────────────────────────────────────┘

After Forgot Password Request:
┌──────────────────────────────────────┐
│ VerificationToken Table              │
├──────────────────────────────────────┤
│ id: "token123"                       │
│ email: "user@example.com"            │
│ token: "$2b$10$hashedResetCode"      │
│ type: "PASSWORD_RESET"               │
│ expiresAt: "2024-01-01T12:15:00Z"    │
│ adminId: "abc123"                    │
└──────────────────────────────────────┘

After Successful Password Reset:
┌──────────────────────────────────────┐
│ Admin Table (Updated)                │
├──────────────────────────────────────┤
│ id: "abc123"                         │
│ email: "user@example.com"            │
│ password: "$2b$10$newHashedPassword" │ ← Updated
│ isEmailVerified: true                │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ VerificationToken Table              │
├──────────────────────────────────────┤
│ (Token deleted - no records)         │ ← Deleted
└──────────────────────────────────────┘
```

---

##  Timeline & Expiration

```
┌─────────────────────────────────────────────────────────────┐
│                    TOKEN LIFECYCLE                          │
└─────────────────────────────────────────────────────────────┘

T+0min  │ User requests password reset
        │ ↓
        │ Token created with 15-minute expiration
        │ Email sent with 6-digit code
        │
T+5min  │ User enters code
        │ ↓
        │ Code verified ✓
        │ User enters new password
        │
T+7min  │ Password reset successful
        │ ↓
        │ Token deleted
        │ Confirmation email sent
        │
T+15min │ [If not used] Token expires
        │ ↓
        │ User must request new code
        │
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ERROR SCENARIOS                          │
└─────────────────────────────────────────────────────────────┘

Email Not Found
├─ Return: "No account found with this email address."
└─ Action: User can try different email or register

Email Not Verified
├─ Return: "Email not verified. Please verify your email first."
└─ Action: Redirect to email verification flow

Invalid Reset Code
├─ Return: "The reset code is incorrect. Please try again."
└─ Action: User can re-enter code or request new one

Expired Reset Code
├─ Return: "Your reset code has expired. Please request a new one."
└─ Action: User must request new password reset

Weak Password
├─ Return: "Password must contain uppercase, lowercase, number, special char"
└─ Action: User must enter stronger password

Same Password
├─ Return: "New password must be different from current password."
└─ Action: User must choose different password

Rate Limit Exceeded
├─ Return: "Too many attempts. Please try again after 15 minutes."
└─ Action: User must wait before retrying

Email Sending Failed
├─ Return: "Failed to send email. Please try again later."
└─ Action: User can retry or contact support
```

---

## Success Paths

```
┌─────────────────────────────────────────────────────────────┐
│                    HAPPY PATH                               │
└─────────────────────────────────────────────────────────────┘

Path 1: With Code Verification (Recommended)
User → Request Reset → Receive Email → Verify Code → 
Enter Password → Success → Login

Path 2: Without Code Verification (Faster)
User → Request Reset → Receive Email → Enter Code + Password → 
Success → Login

Path 3: With Resend
User → Request Reset → Email Delayed → Resend Code → 
Receive Email → Enter Code + Password → Success → Login
```

---

## Frontend State Management

```
┌─────────────────────────────────────────────────────────────┐
│                FRONTEND STATE FLOW                          │
└─────────────────────────────────────────────────────────────┘

State: 'initial'
├─ Show: Email input form
└─ Actions: Submit email

State: 'code-sent'
├─ Show: Code input form, resend button, timer
└─ Actions: Verify code, resend code

State: 'code-verified'
├─ Show: New password form
└─ Actions: Submit new password

State: 'success'
├─ Show: Success message, redirect countdown
└─ Actions: Auto-redirect to login

State: 'error'
├─ Show: Error message, retry button
└─ Actions: Retry or go back
```

---

## Alternative Flows

### Resend Code Flow
```
User on "Enter Code" page
    ↓
Clicks "Resend Code"
    ↓
POST /api/auth/forgot-password (again)
    ↓
Old token deleted
    ↓
New token created
    ↓
New email sent
    ↓
User receives new code
```

### Multiple Attempts Flow
```
User enters wrong code (Attempt 1)
    ↓
Error: "Invalid code"
    ↓
User enters wrong code (Attempt 2)
    ↓
Error: "Invalid code"
    ↓
User enters wrong code (Attempt 3)
    ↓
Error: "Invalid code"
    ↓
User clicks "Resend Code"
    ↓
New code generated
```

---

## Email Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    EMAIL SEQUENCE                           │
└─────────────────────────────────────────────────────────────┘

Email 1: Password Reset Request
├─ Trigger: User requests password reset
├─ Template: forgot-password.ejs
├─ Contains: 6-digit code, expiration warning
└─ Action: User enters code

Email 2: Password Reset Success
├─ Trigger: Password successfully reset
├─ Template: password-reset-success.ejs
├─ Contains: Confirmation, security alert
└─ Action: User logs in with new password
```

---

This visual guide helps understand the complete flow, security measures, and state management for the forgot password feature.
