# Staging configuration

Staging must use separate credentials, database, object-storage bucket, vector store namespace, payment account/mode, email domain and telemetry project from production.

Required secrets/config:
- DATABASE_URL
- OPENAI_API_KEY
- SESSION_SECRET
- S3_ENDPOINT, S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- RESEND_API_KEY, EMAIL_FROM
- OTEL_EXPORTER_OTLP_ENDPOINT

Before promotion: run migrations, seed a non-production teacher/student fixture, run browser E2E, payment webhook replay tests, email token tests, MFA tests, tenant isolation tests, and backup/restore drill.
