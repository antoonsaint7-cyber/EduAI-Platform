# Commercial Release Runbook

## Staging
1. Use isolated PostgreSQL, S3 bucket, OpenAI project/limits, Stripe test mode, email domain and telemetry project.
2. Apply migrations.
3. Run unit, integration and Playwright E2E tests.
4. Verify tenant isolation with two schools.
5. Exercise signup, email verification, password reset and MFA.
6. Exercise Stripe checkout, signed webhook, renewal/cancel/failure paths.
7. Exercise multimodal and Realtime sessions with test quotas.
8. Run load tests and verify queue backpressure.
9. Run backup and restore drill and record RPO/RTO.

## Production promotion gates
- CI green on the exact release commit.
- No critical/high dependency or security findings.
- Staging smoke and E2E green.
- Signed payment webhook replay succeeds.
- Email verification/reset succeeds.
- MFA enrollment and challenge succeeds.
- Cross-tenant access tests pass.
- Backup restore drill is recent and successful.
- Monitoring dashboards and alerts are active.
- Rollback image/version is available.
- Production secrets are supplied only through the deployment secret manager.

## Pilot
Start with a small cohort. Track activation, lesson completion, AI cost per active student, error rate, latency, retention and support incidents before general availability.

## Rollback
Stop rollout, switch traffic to the previous immutable release, preserve failed-release logs, restore database only when a schema/data rollback is required, and document the incident.
