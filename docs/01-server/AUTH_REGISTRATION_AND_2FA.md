# Authentication, Registration and 2FA Plan

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
**This document owns:** the complete teacher identity roadmap and security requirements

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## Priority

Full account management is required, but it follows the first playable race loop.
The current JWT-cookie login remains in service while the new flow is added in
production-ready vertical slices.

## Current state

Implemented:

- username/password login
- BCrypt hash
- JWT HttpOnly cookie
- current-user lookup
- logout
- role authorization.

Client-ready but server-missing:

- registration screen
- forgot-password screen.

Missing:

- email field/unique identity
- registration endpoint
- email verification
- password reset
- 2FA.

## Target teacher lifecycle

```text
Register
→ receive verification message
→ verify email
→ login with password
→ if 2FA enabled, complete TOTP challenge
→ receive authenticated cookie
```

Recovery:

```text
request reset
→ generic response
→ verify short-lived code/link
→ choose new password
→ revoke used reset token
→ optionally revoke sessions
```

## Phase A — Registration and verified email

Server:

- add normalized unique email
- preserve username compatibility during migration
- validate name/email/password/terms version
- create account as unverified
- send verification token/code
- activate after verification.

Security:

- generic duplicate/account responses where enumeration is a risk
- verification token expiry
- hashed token storage
- one-time use
- resend cooldown/rate limit.

## Phase B — Forgot/reset password

- generic request response
- expiring one-time token/code
- maximum attempts
- hashed storage
- password policy
- session/token invalidation after reset
- audit event.

## Phase C — TOTP 2FA

Do not implement TOTP cryptography manually. Select a maintained library after a
focused dependency review.

Setup:

```text
authenticated teacher requests setup
→ server creates secret
→ server returns otpauth URI/QR payload
→ teacher enters current 6-digit code
→ server verifies
→ server stores encrypted/protected secret and marks 2FA enabled
→ recovery codes are generated and shown once
```

Login:

```text
password accepted
→ server returns short-lived 2FA challenge, not full auth cookie
→ teacher submits TOTP/recovery code
→ server verifies and issues normal auth cookie
```

Required protections:

- challenge expiry
- replay/time-window handling
- rate limits and lockout/backoff
- recovery codes stored hashed
- one-time recovery code use
- 2FA disable requires password + TOTP/recovery confirmation
- security-event logging.

## Client screens

- register
- verify email
- forgot password
- verify reset code/link
- reset password
- 2FA setup QR + confirmation
- 2FA login challenge
- recovery-code display/download warning
- 2FA management.

All text goes through i18n. Forms use Mantine form/input components. The client does
not decide whether a code is valid.

## Definition of done

A clean account can register, verify, login, enable 2FA, pass a challenge, recover
access and disable/re-enable 2FA. Enumeration, replay, brute-force and expired-token
tests pass.
