# EduAI Platform

AI Educational SaaS source code for curriculum-aware, adaptive learning platforms for schools, teachers, and students.

## Core Educational Engine

```text
Upload Curriculum → Analyze → Generate → Ground/Evaluate
        → Teacher Review → Publish → Student Learning
        → Assessment → Mastery → Adaptive Learning
```

## Included

- Curriculum-aware AI generation and grounding
- Educational evaluation, assessment, and adaptive-learning foundation
- Multimodal tutoring and realtime voice foundations
- Multi-tenant schools, teachers, students, and tenant-isolation tests
- Email verification, password reset, MFA/TOTP, rate limiting and security checks
- Stripe payments and signed webhook handling
- Email provider integration
- S3-compatible storage
- PostgreSQL
- OpenTelemetry integration points
- Backup/restore tooling
- GitHub Actions, integration tests and Playwright E2E

## Commercial Source-Code Product

The current model is **source-code licensing**, not a hosted SaaS subscription. Buyers supply their own OpenAI, Stripe, email, S3, PostgreSQL, monitoring and hosting accounts.

Suggested positioning: **EduAI Platform - AI Educational SaaS Source Code**

Suggested launch price: **$499**. Suggested regular price after validation: **$799+**. Custom/white-label implementations are priced separately.

These are positioning suggestions, not licensing terms. Use an explicit commercial license defining installation, commercial use, redistribution/resale restrictions, support and update rights.

## Quick Start

Requirements: Node.js 20+, npm and PostgreSQL for database-backed features.

```bash
npm install
npm start
npm run worker
```

Never commit real secrets. Configure external provider credentials in the deployment environment.

## Tests

```bash
npm test
npm run test:integration
npm run test:e2e
```

## Release Flow

```text
Feature Branch → CI → Staging → E2E/Security/Load/Restore → Pilot → Production
```

See `ops/RELEASE_RUNBOOK.md` for staging, production gates, pilot and rollback procedures.

## Production Note

Passing repository CI does not provision external production infrastructure. Validate staging, PostgreSQL, S3/IAM, Stripe webhooks, email delivery, OpenAI limits, realtime voice, multimodal usage, tenant isolation, load testing, backup/restore, monitoring, alerts, rollback and applicable privacy/legal requirements before a real launch.

## Product Philosophy

**Curriculum → Learning Objectives → Content → Evaluation → Teacher Review → Student Learning → Assessment → Mastery → Adaptation**
