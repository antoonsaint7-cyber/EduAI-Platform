# EduAI Platform Commercial Readiness

## Release target

Commercial-ready V1 means the platform's real Teacher → Student → Course → Lesson → Assessment → Mastery → Recommendation → Tutor flow is implemented and verified through production route wiring.

## Verified baseline

- Authentication and email verification
- MFA foundations
- Multi-tenancy foundations
- Course and lesson management
- Publishing and enrollment
- Assessment submission
- Skill-aware adaptive mastery
- Recommendations
- Lesson-aware grounded Tutor
- PostgreSQL + Redis CI services
- Real HTTP E2E coverage

## Remaining release checks

### Product
- [ ] Review all dashboard controls for real API wiring
- [ ] Review assessment authoring and review UX
- [ ] Review student learning flow and empty/error/loading states
- [ ] Review teacher analytics and authorization
- [ ] Review Arabic/English and RTL behavior

### Security
- [ ] Tenant isolation regression suite
- [ ] Course/lesson authorization regression suite
- [ ] RAG cross-course and cross-tenant isolation
- [ ] Student/teacher privilege boundary review
- [ ] Sensitive error/log review

### Operations
- [ ] Clean PostgreSQL migration from empty database
- [ ] Redis worker startup verification
- [ ] Production environment variable audit
- [ ] Deployment documentation
- [ ] Backup/restore guidance

### Release
- [ ] `npm test`
- [ ] `npm run test:e2e`
- [ ] CI green on release commit
- [ ] `npm audit --audit-level=high`
- [ ] Final manual smoke test
- [ ] Version/tag release

## Commercial principle

Do not advertise a capability unless the real production route, authorization, persistence, and tests support it. External AI and payment providers remain buyer-configured services; the base repository must remain installable without our own paid credentials.
