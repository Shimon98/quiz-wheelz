# QuizWheelz — Server Auth Future Plan

## 1. Purpose

This document plans future server-side authentication improvements.

It is not the current Stage B priority.

Current priority remains the race engine and core playable loop.

## 2. Current Auth Direction

Teacher authentication currently uses a server-issued JWT stored in an HttpOnly cookie.

The frontend must not store teacher JWT in localStorage.

Student race sessions are separate from teacher authentication.

## 3. Future Teacher Auth Goals

Future teacher auth should support:

- Login by email.
- Teacher registration.
- Email verification.
- Forgot password.
- Code verification.
- Reset password.
- Optional future MFA / authenticator app flow.

## 4. Email Instead of Username

Current backend may still use username.

Future goal:

```text
Teacher login should use email as the primary identifier.
```

Migration approach:

1. UI label becomes "Email or username".
2. Backend still accepts existing username.
3. Add email field and uniqueness rule if missing.
4. Add login by email.
5. Deprecate username-only login.

## 5. Teacher Registration

Future endpoint direction:

```http
POST /api/auth/register
```

Request example:

```json
{
  "fullName": "Teacher Name",
  "email": "teacher@example.com",
  "password": "...",
  "confirmPassword": "..."
}
```

Validation:

- Required full name.
- Valid email.
- Unique email.
- Strong password.
- Confirm password matches.
- Terms accepted on frontend; backend may record version later.

## 6. Email Verification

Recommended future flow:

```text
Teacher registers
Server creates account as unverified
Server sends verification email
Teacher clicks link or enters code
Server marks email verified
Teacher can login or account becomes fully active
```

Possible endpoint directions:

```http
POST /api/auth/email-verification/send
POST /api/auth/email-verification/verify
```

## 7. Forgot Password Flow

### Step 1 — Request Code

```http
POST /api/auth/password/forgot
```

Request:

```json
{
  "email": "teacher@example.com"
}
```

Response should be generic:

```text
If an account exists, a reset code was sent.
```

This prevents account enumeration.

### Step 2 — Verify Code

```http
POST /api/auth/password/verify-code
```

### Step 3 — Reset Password

```http
POST /api/auth/password/reset
```

## 8. Security Requirements

- Password reset codes expire.
- Codes are stored hashed if possible.
- Do not reveal whether an email exists.
- Rate limit attempts later.
- Invalidate used codes.
- Log important auth events if needed.
- Do not send passwords by email.

## 9. Future Authenticator App / MFA Idea

Future only:

```text
Teacher enables MFA
Server creates TOTP secret
Teacher scans QR in authenticator app
Teacher enters 6-digit code
Server verifies and enables MFA
Future login requires password + MFA code
```

This should not be implemented until the core app is stable.

## 10. Not Current Priority

Do not implement this plan before Issue 22, Issue 23, Issue 24, student join flow, and the basic teacher race loop.
