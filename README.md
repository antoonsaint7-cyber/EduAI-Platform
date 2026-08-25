# EduAI Platform 🎓🤖

Commercial AI-powered educational platform starter for teachers, schools, and education businesses.

EduAI turns curriculum source material into a controlled workflow for analysis, lesson generation, teacher review, publishing, student assessment, and progress tracking.

## Educational Engine

```text
Upload Curriculum → Analyze → Generate → Evaluate → Teacher Review
                                      ↓
Student Learning → Assessment → Progress / Mastery
```

## What is implemented

| Area | Status |
|---|---|
| Curriculum storage and AI analysis | ✅ Implemented |
| AI lesson generation + teacher review | ✅ Implemented |
| Teacher / student roles | ✅ Implemented |
| PostgreSQL persistence | ✅ Implemented |
| Authentication + signed sessions | ✅ Implemented |
| MFA / TOTP enrollment and verification | ✅ Implemented |
| Tenant isolation at query boundary | ✅ Implemented |
| Assessments + student attempts | ✅ Implemented |
| Progress tracking | ✅ Implemented |
| Stripe subscription checkout + signed webhooks | ✅ Implemented |
| S3 object storage integration | ✅ Implemented |
| Realtime voice ephemeral-token endpoint | ✅ Implemented |
| Background worker foundation | ✅ Implemented |
| Integration tests | ✅ Implemented |
| Playwright E2E | ✅ Implemented |
| CI + dependency audit | ✅ Implemented |
| Docker + PostgreSQL production topology | ✅ Implemented |
| Commercial license | ✅ Included |

## Architecture

```text
Teacher / Student Browser
          ↓
      Express API
          ├── Auth / MFA
          ├── Tenant isolation
          ├── Curriculum Engine
          ├── Lessons / Assessments
          ├── AI / Realtime
          ├── Billing
          └── Storage
          ↓
 PostgreSQL + S3 + OpenAI + Stripe
          ↓
      Background Worker
```

## Quick start

Requirements: Node.js 20+ and PostgreSQL 16+.

```bash
cp .env.example .env
npm install
```

Apply the database schema:

```bash
psql "$DATABASE_URL" -f infra/schema.sql
```

Run the app:

```bash
npm start
```

Run the worker separately:

```bash
npm run worker
```

Open `http://localhost:3000`.

### Docker

```bash
export AUTH_SECRET="replace-with-a-long-random-secret"
export OPENAI_API_KEY="your_key"
docker compose up --build
```

## API highlights

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/mfa/enroll`
- `POST /api/curricula`
- `POST /api/curricula/:id/analyze`
- `POST /api/curricula/:id/lessons`
- `POST /api/lessons/:id/review`
- `POST /api/assessments`
- `POST /api/assessments/:id/attempts`
- `GET /api/progress`
- `POST /api/ai/chat`
- `POST /api/realtime/token`
- `POST /api/storage/upload`
- `POST /api/billing/checkout`
- `POST /api/billing/webhook`
- `GET /health`

## Testing

```bash
npm test
npm run test:integration
npm run test:e2e
npm run evals
npm audit --audit-level=high
```

## Security

- Secrets are environment variables, never committed.
- Passwords use Node.js `scrypt` hashing.
- Signed, expiring application sessions.
- MFA/TOTP support.
- Request size validation and rate limiting.
- Tenant IDs are enforced server-side.
- Stripe webhooks use signature verification.
- S3 objects use server-side encryption.
- Security headers are enabled by default.

For production, rotate `AUTH_SECRET`, use a managed PostgreSQL instance, private S3 buckets, HTTPS, centralized logs/alerts, backups, restore drills, and a customer-specific privacy/compliance review.

## What the buyer provides

- OpenAI credentials and usage budget.
- Stripe account and price IDs.
- AWS/S3 account if storage is enabled.
- PostgreSQL infrastructure.
- Email provider if transactional email is added.
- Hosting, domain, monitoring, backups, and production secrets.

No production credentials or real user data are included.

## Commercial licensing

This project is sold as **commercial source code**. See [`LICENSE.md`](LICENSE.md) for the baseline commercial license.

Suggested pricing:

- Launch: **$499/year**
- Professional: **$799+/year**
- White-label / enterprise deployment: custom pricing

The license controls deployment and redistribution rights. Third-party services remain subject to their own terms.

## Release checklist

1. `npm test`
2. `npm run test:integration`
3. `npm run test:e2e`
4. `npm run evals`
5. `npm audit --audit-level=high`
6. Configure production secrets through a secret manager.
7. Run database backup + restore drill.
8. Verify Stripe webhook signing.
9. Verify tenant isolation and MFA.
10. Review `docs/RELEASE_RUNBOOK.md` before production deployment.
