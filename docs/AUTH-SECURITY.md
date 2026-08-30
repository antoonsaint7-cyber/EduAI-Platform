# Authentication & Security Hardening

Phase 3 establishes production-safe authentication primitives.

- Passwords use Node `scrypt` with per-password random salts.
- Session tokens are random and only SHA-256 hashes are persisted.
- Session cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- Password reset tokens must be random, hashed at rest, single-use, and expire quickly.
- MFA secrets must never be logged or returned after enrollment; the production adapter should use an audited TOTP/WebAuthn implementation.
- Authentication endpoints are rate-limited.
- Tenant and role checks remain mandatory for protected application operations.

## Remaining production integration

Add database fields/tables for email verification, password-reset state, MFA enrollment/recovery codes and session revocation/rotation. Use a transactional, single-use reset flow and audit security-sensitive events. Prefer WebAuthn/passkeys or an audited TOTP library rather than implementing cryptographic MFA verification from scratch.
