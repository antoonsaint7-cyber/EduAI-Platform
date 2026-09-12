# EduAI Platform Commercial V1

## What is included

EduAI Platform is a source-code LMS foundation combining conventional course delivery with adaptive assessment and grounded AI tutoring.

### Teacher

- Create and manage courses
- Manage lessons and learning resources
- Publish/archive learning content
- Create/review assessments
- Review student performance and learning signals

### Student

- Browse published enrolled courses
- Learn from published lessons
- Complete lessons and track progress
- Take assessments
- Receive adaptive mastery and recommendations
- Ask the lesson-aware AI Tutor questions against authorized learning content

### Platform

- Authentication and email verification
- MFA foundations
- Multi-tenancy foundations
- PostgreSQL persistence
- Redis/BullMQ worker infrastructure
- Grounded RAG foundations
- Stripe billing foundations
- CI with PostgreSQL and Redis services
- Real HTTP E2E coverage

## Buyer responsibilities

This is source code. The buyer supplies hosting, database, Redis, domain/email infrastructure, AI provider credentials and payment-provider credentials when those integrations are enabled.

## Important limitation

The base repository intentionally does not include the seller's paid API credentials or hosted production infrastructure. AI responses require the buyer's configured AI provider. Billing requires the buyer's configured Stripe account.

## Validation philosophy

The project treats the real production route wiring as the source of truth. The Real E2E test is intentionally not a fake browser demo: it creates real users, courses, lessons, memberships and assessment data, submits through the production API, checks mastery/recommendations and reaches the real Tutor boundary.
