# Authentication & Security Hardening

EduAI authentication now requires verified email before a session can be issued.

- Passwords use Node `scrypt` with per-password random salts.
- Session tokens are random and only SHA-256 hashes are persisted.
- Session cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- Email verification tokens are random, hashed at rest, expire after 24 hours, and are deleted after successful verification.
- Password-reset tokens are random, hashed at rest, single-use, and expire after 30 minutes.
- Resetting a password revokes existing sessions and outstanding MFA challenges.
- Verified users with MFA enabled receive a short-lived challenge instead of a session.
- MFA challenges accept either a six-digit TOTP code or an unused recovery code.
- MFA challenges expire after five minutes and are removed after successful use or five failed attempts.
- Recovery codes are consumed after successful use.
- Authentication endpoints are rate-limited.
- Tenant and role checks remain mandatory for protected application operations.

## MFA enrollment

Authenticated users can call `/api/auth/mfa/setup`, confirm the generated secret with `/api/auth/mfa/confirm`, and then use TOTP or recovery codes during login. Recovery codes are returned only during setup so the client can display them once for secure storage.

## Test-only token visibility

For local/test environments, `AUTH_DEBUG_TOKENS=true` exposes verification/reset tokens in response headers so E2E tests can exercise the complete flow without a mail provider. Production never exposes these headers.
