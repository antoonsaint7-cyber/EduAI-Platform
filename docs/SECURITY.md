# Security Notes

## Tenant isolation

Tenant-scoped resources must always be authorized using the authenticated user's tenant and role. Never accept a tenant identifier from the browser as proof of access.

## Course and lesson access

Students may access learning content only when the course is published and the student has an active/completed course membership. Teachers may manage only resources allowed by their tenant and role.

## RAG isolation

RAG retrieval must remain scoped to the authenticated tenant and, when supplied, the authorized course/lesson. Client-provided lesson content is untrusted reference material and cannot grant access to a document.

## Authentication

Email verification and session authentication are required by the normal login flow. MFA is available through the existing authentication APIs. Debug verification tokens are intended only for automated test environments and must never be enabled in production.

## Secrets

Do not commit API keys, database passwords, session secrets, Stripe webhook secrets or private certificates. Use deployment environment variables or a secret manager.

## Reporting a defect

Before commercial release, reproduce security issues with a regression test where practical and ensure the test exercises the production authorization path rather than a mocked handler.
