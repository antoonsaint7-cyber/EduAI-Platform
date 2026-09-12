# Release Candidate Checklist

Run this checklist on the exact commit intended for sale.

## Automated

- [ ] `npm ci`
- [ ] `npm run db:migrate` against a clean disposable PostgreSQL database
- [ ] `npm test`
- [ ] `npm run test:e2e`
- [ ] evaluation suite used by CI
- [ ] `npm audit --audit-level=high`
- [ ] GitHub Actions CI green

## Real product flow

- [ ] Teacher registers and verifies email
- [ ] Teacher creates and publishes a course
- [ ] Teacher creates and publishes a lesson
- [ ] Student registers and verifies email
- [ ] Student enrolls
- [ ] Student opens published lesson
- [ ] Student completes lesson
- [ ] Student takes assessment
- [ ] Assessment updates mastery
- [ ] Recommendations are returned
- [ ] Recommended lesson opens in the correct course context
- [ ] Tutor uses the lesson-aware production endpoint

## Security

- [ ] Cross-tenant course access denied
- [ ] Cross-tenant lesson access denied
- [ ] Student cannot access teacher analytics
- [ ] Student cannot access unpublished learning content
- [ ] RAG retrieval is tenant/course/lesson scoped
- [ ] No debug auth tokens in production
- [ ] No real credentials committed

## UX

- [ ] Desktop dashboard
- [ ] Mobile dashboard
- [ ] Arabic RTL
- [ ] English LTR
- [ ] Loading states
- [ ] Empty states
- [ ] API error states
- [ ] No dead primary actions

## Release hygiene

- [ ] README accurate
- [ ] `.env.example` accurate
- [ ] deployment guide accurate
- [ ] security notes accurate
- [ ] version bumped intentionally
- [ ] PR reviewed
- [ ] release tag created only after CI is green
