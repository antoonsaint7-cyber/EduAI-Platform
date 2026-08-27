# SaaS Deployment & Live Demo

## Architecture

`Web/API -> Auth/RBAC -> PostgreSQL`

Large documents must use an asynchronous pipeline:

`Upload -> API stores object -> BullMQ -> Redis -> RAG Worker -> extract -> chunk -> embeddings -> vector store -> citations`

The API should return `202 Accepted` with a `jobId`; clients poll or subscribe to job status. The worker must enforce `tenantId` on every document, chunk and retrieval operation.

## RBAC

| Role | Scope | Capabilities |
|---|---|---|
| SuperAdmin | All tenants | Platform administration, tenant/user management, audit and billing oversight |
| SchoolAdmin | Own school | Manage school users, courses, analytics and billing settings |
| Teacher | Assigned school/classes | Lessons, assessments, question banks, student analytics |
| Student | Own account/classes | Learning content, assessments, submissions and own progress |

Authorization is enforced server-side. UI hiding is not a security boundary.

## Live demo

Deploy the application behind HTTPS and configure a dedicated demo tenant. Use seeded, non-production accounts and synthetic data. Do not expose production API keys or real student data.

Recommended environment variables:

- `DATABASE_URL`
- `OPENAI_API_KEY`
- `REDIS_URL`
- `VECTOR_STORE_URL` / provider credentials
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `APP_BASE_URL`

Before publishing a demo URL, run unit, syntax and end-to-end smoke tests against the deployed environment.

## BullMQ integration

The repository contains the queue contract in `src/async-rag-worker.js`. Install and wire BullMQ/Redis in the deployment environment, then use the adapter to enqueue `document-ingestion` jobs. This keeps heavy PDF processing out of the request/response path.
