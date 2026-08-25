# Commercial Platform Completion

## Product pillars
1. Student learning: adaptive mastery, assessments, progress, notifications.
2. Teacher productivity: curriculum ingestion, AI generation, review, publishing, versioning and rollback.
3. School administration: tenant isolation, roles, usage visibility and audit.
4. Commercial controls: plans, quotas, usage counters and payment-provider adapter boundary.

## Current release

The branch adds persistent learning/assessment/billing primitives and dashboard/API foundations while preserving the existing curriculum pipeline.

## Remaining provider integrations

- Connect a production payment provider and verify webhooks server-side before changing subscription state.
- Replace mounted-file storage with S3-compatible object storage in cloud deployments.
- Add email verification, password reset and MFA using a dedicated identity provider or hardened transactional email flow.
- Add OpenTelemetry/metrics backend and alerting.
- Add Realtime Voice and multimodal tutoring behind feature flags.

## Multi-tenant school model

The next database migration should add organizations, memberships, classes and organization-scoped curriculum ownership. Every query must enforce tenant scope at the repository layer, not only in UI code.

## Safety requirements

- Student access is limited to published curriculum.
- Teacher/Admin approval is required before publication.
- Uploaded documents are untrusted data; instructions inside them cannot override system/developer policy.
- Grounding threshold blocks unsupported generated content.
- API keys remain server-side.
- Usage limits must be enforced server-side before expensive model operations.

## Commercial launch checklist

- [ ] Production database backups and restore drill
- [ ] S3-compatible object storage
- [ ] Auth verification/reset/MFA
- [ ] Payment provider + webhook signature verification
- [ ] School multi-tenancy
- [ ] Monitoring/alerts
- [ ] Privacy policy / terms / data retention policy
- [ ] Load test and rate-limit tuning
- [ ] E2E browser tests
- [ ] Staged deployment and rollback
