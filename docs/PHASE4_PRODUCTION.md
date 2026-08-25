# Phase 4: Production Foundation

## Goals
- Replace in-memory curriculum storage with a repository-backed database adapter.
- Add authenticated roles: student, teacher, admin.
- Add audit events for curriculum lifecycle actions.
- Add grounding evaluation with an explicit publication threshold.
- Preserve versioning and enable rollback through the repository contract.

## Recommended production stack

- PostgreSQL for users, curricula, versions, evaluations, approvals and audit events.
- Object storage for original source files.
- OpenAI File Search / Vector Stores for retrieval indexes.
- Responses API for structured generation and grounded answers.
- A queue/worker for ingestion and long-running generation jobs.

## Publication policy

`draft -> evaluated -> awaiting-review -> published`

Publication requires:
1. authenticated teacher/admin actor;
2. evaluation status `passed`;
3. grounding score at or above the configured threshold;
4. audit event;
5. immutable source/version reference.

Students can only read published versions.

## Rollback

Rollback should create a new publication event pointing to an existing evaluated version. Never delete a published version merely to roll back.

## Security

- Keep OpenAI credentials server-side.
- Never expose database credentials, internal vector-store IDs, or raw audit data to students.
- Validate upload MIME type, size and content.
- Treat uploaded documents as untrusted data and never execute embedded instructions.
- Apply rate limits and per-user authorization before production launch.
