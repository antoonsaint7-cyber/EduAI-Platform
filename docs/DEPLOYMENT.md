# Deployment Guide

## Services

A production deployment requires:

1. Node.js 24+ application process running `npm start`.
2. PostgreSQL 16+.
3. Redis 7+ when queue/RAG features are enabled.
4. A separate worker process running `npm run worker` for queued RAG ingestion.
5. Buyer-managed OpenAI credentials for AI features.
6. Buyer-managed Stripe credentials when billing is enabled.

## Environment

Set `DATABASE_URL` and `REDIS_URL` first. Configure `OPENAI_API_KEY` only when AI features are enabled. Configure the Stripe variables used by the billing routes when billing is enabled.

Never use `AUTH_DEBUG_TOKENS=true` in production.

## Database

Run migrations before starting application traffic:

```bash
npm ci
npm run db:migrate
npm start
```

For upgrades, take a database backup before applying migrations and verify the migration log before serving traffic.

## Worker

Run the RAG worker separately:

```bash
npm run worker
```

The worker and application should use the same PostgreSQL and Redis instances.

## Health and smoke test

After deployment, verify `/health`, authentication, course publishing, enrollment, assessment submission and the Tutor boundary. Do not treat a page loading successfully as proof that the backend workflow works.

## External services

The platform does not ship with the seller's OpenAI, Stripe, email, storage, database or Redis credentials. The buyer owns and configures those services.

## CI before release

The release candidate should pass:

```bash
npm test
npm run test:e2e
npm audit --audit-level=high
```

GitHub Actions supplies PostgreSQL and Redis services for authoritative integration/E2E validation.
