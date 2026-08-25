# Release Runbook

## Pre-release
1. Run unit, integration, E2E and offline evals.
2. Run `npm audit --audit-level=high`.
3. Review environment variables and secret-manager entries.
4. Confirm database backup completed and restore test is current.
5. Confirm Stripe webhook endpoint and signing secret.
6. Verify S3 bucket is private and encryption is enabled.

## Staging
1. Apply `infra/schema.sql` to the staging database.
2. Deploy application and worker.
3. Run `/health` smoke check.
4. Register an owner, enable MFA, create a teacher and student.
5. Create curriculum, analyze it, generate a lesson, approve it, create assessment and submit a student attempt.
6. Verify tenant A cannot access tenant B records.
7. Verify Stripe webhook signature rejection with an invalid signature.
8. Verify realtime token endpoint never exposes the standard OpenAI API key.

## Production
Use a managed PostgreSQL service, private object storage, HTTPS, secret manager, monitoring and alerting. Deploy application and worker independently but from the same release tag.

## Rollback
1. Stop traffic to the new application version.
2. Restore the previous application image/tag.
3. Do not automatically roll back database schema changes unless the migration is explicitly reversible.
4. Re-run `/health` and critical smoke tests.
5. Record the incident and root cause before the next deployment.
