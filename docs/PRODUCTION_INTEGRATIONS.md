# Production integrations

This branch adds the provider adapters and infrastructure contracts required for commercial launch.

## Payments

Stripe Checkout creation is server-side and payment webhooks require a timestamped HMAC signature. Persist the provider event ID before processing business effects so retries are idempotent. Set `STRIPE_SECRET_KEY`, price IDs and `PAYMENT_WEBHOOK_SECRET`.

## Email

Transactional email uses Resend over HTTPS. Verification and password-reset tokens are random, single-use, hashed at rest and expire. Configure `RESEND_API_KEY`, `EMAIL_FROM` and `PUBLIC_BASE_URL`.

## MFA

TOTP verification is implemented without storing plaintext tokens. Production must encrypt the TOTP secret using `MFA_ENCRYPTION_KEY` before writing it to `mfa_methods` and require MFA for teacher/admin sensitive actions.

## S3

The storage adapter already supports S3-compatible object storage and AES server-side encryption. In production set `STORAGE_DRIVER=s3`, bucket and credentials. Prefer IAM/workload identity over long-lived access keys where the deployment platform supports it.

## Multi-tenancy

`tenants` and `tenant_memberships` provide school isolation. Every curriculum query must be scoped by `tenant_id`; never accept a tenant ID from a student without checking membership. School admins manage members; teachers manage curriculum within their school.

## Observability

`src/platform/telemetry.js` exports OTLP-compatible spans over HTTP. Point `OTEL_EXPORTER_OTLP_ENDPOINT` at an OpenTelemetry Collector or managed provider. Do not send student PII in span attributes.

## Realtime Voice

The server creates short-lived Realtime client secrets. The browser then establishes the realtime session directly with OpenAI. Never expose `OPENAI_API_KEY` to the browser. Realtime usage must count against plan voice quotas.

## Multimodal tutoring

`src/platform/multimodal.js` accepts validated image data URLs and sends them to the Responses API together with curriculum context. Production endpoints must enforce file size/type limits, authentication, tenant ownership and usage quotas before calling this service.

## Browser E2E

Playwright configuration and a smoke test are included. CI installs Chromium and runs the browser suite. Add authenticated student/teacher journeys before release.

## Backup and restore

`scripts/backup.sh` creates a PostgreSQL custom-format dump and SHA-256 checksum. `scripts/restore.sh` restores a selected dump. Production must run backups on a schedule, copy them to encrypted object storage, retain multiple generations, and perform periodic restore drills.

## Provider boundary

These adapters make real provider calls when their credentials are configured. They intentionally fail closed when production credentials are missing. No fake payment, fake email, fake voice or fake storage service is used.

## Final launch gates

1. Configure provider secrets in the deployment secret manager, never in Git.
2. Run database migrations.
3. Configure Stripe webhook endpoint and verify signatures.
4. Configure email domain and verify deliverability.
5. Encrypt MFA secrets at rest.
6. Configure S3 lifecycle/versioning and backup retention.
7. Configure OpenTelemetry Collector and alerts.
8. Configure Realtime quotas and abuse controls.
9. Run E2E against a staging database.
10. Execute a backup restore drill before the first production release.
