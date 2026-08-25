# Production configuration

Production is fail-closed. Do not deploy until all provider credentials and infrastructure controls are configured outside Git.

## Required controls
- Managed PostgreSQL with encrypted backups and tested restore.
- S3-compatible private bucket, encryption, lifecycle and least-privilege IAM.
- Stripe live-mode secret and verified webhook endpoint.
- Verified transactional email domain and Resend API key.
- OpenAI API key stored only in the server secret manager.
- Strong session secret and secure cookies behind HTTPS.
- OTLP collector/monitoring destination with alerting.
- Separate production Realtime project/limits.
- Domain/TLS and secure headers.
- Database migrations run as a release step before app rollout.

## Release gates
1. CI green.
2. Staging smoke + browser E2E green.
3. Migration dry run succeeds.
4. Backup and restore drill has a recent successful result.
5. Stripe signed webhook replay succeeds.
6. Email verification/reset succeeds.
7. MFA enrollment/login challenge succeeds.
8. Tenant isolation tests pass.
9. No production secrets exist in repository history.
10. Rollback procedure is documented and tested.

## Deployment
Use immutable application images, rolling/blue-green deployment, health checks, automatic rollback on failed health checks, and least-privilege service identities.
