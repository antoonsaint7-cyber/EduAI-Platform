# Authentication Hardening

This phase adds the production authentication foundation for email verification, password reset, and MFA/TOTP.

## Implemented

- Single-use, expiring SHA-256 hashed email-verification and password-reset tokens.
- Password reset invalidates all existing sessions for the account.
- TOTP secrets are encrypted at rest with `AUTH_MFA_ENCRYPTION_KEY`.
- TOTP verification allows one adjacent 30-second clock window in either direction.
- Eight one-time hashed recovery codes are generated when MFA is enabled.
- Auth endpoints use dedicated rate limits and generic responses for account-discovery-sensitive flows.
- Email delivery uses the Resend HTTP API when `RESEND_API_KEY`, `AUTH_EMAIL_FROM`, and `AUTH_PUBLIC_BASE_URL` are configured.

## Required production secrets

Set these in the production secret manager, never in Git:

- `AUTH_MFA_ENCRYPTION_KEY`
- `RESEND_API_KEY`
- `AUTH_EMAIL_FROM`
- `AUTH_PUBLIC_BASE_URL`

The existing login endpoint still requires a follow-up integration step to enforce an MFA challenge during session creation. MFA enrollment and verification APIs are implemented in this phase; do not treat MFA as fully enforced for production login until that gate is merged and tested.
