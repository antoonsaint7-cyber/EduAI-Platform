# Commercial Launch Readiness

## Release gates
- [ ] CI green: unit, integration, E2E, security
- [ ] Staging deployed with isolated credentials and data
- [ ] Auth: signup, verification, reset, MFA, session revocation
- [ ] Tenant isolation: school → class → teacher → student
- [ ] Billing: checkout, signed webhook, renewal, cancellation, failed payment
- [ ] Teacher dashboard: review/edit/approve/publish/rollback
- [ ] Student dashboard: lessons, assessments, progress
- [ ] Learning engine: mastery, adaptive difficulty, spaced review
- [ ] AI safety: prompt-injection tests, PII controls, moderation
- [ ] Production backups and successful restore drill
- [ ] Monitoring and alerting configured
- [ ] Load test completed with defined SLOs
- [ ] Legal pages published: Terms, Privacy, Refunds, age/education disclosures
- [ ] Pilot cohort completed before public launch

## Required SLOs
Define and approve targets for API availability, p95 latency, job completion latency, failed-generation rate, and recovery time before production launch.

## Pilot
Start with a small teacher/student cohort. Track activation, lesson completion, assessment improvement, AI cost per active user, support incidents, and retention. Promote to general availability only after the release gates and pilot acceptance criteria pass.
