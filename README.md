# EduAI Platform 🎓🤖

> **AI-powered educational platform for turning curriculum content into structured, reviewable, and measurable learning experiences.**

EduAI is a **commercial source-code platform** designed for teachers, schools, education startups, and developers building AI-powered learning products.

It provides an educational workflow that transforms raw curriculum content into AI-assisted lessons, teacher-reviewed content, student learning experiences, assessments, and progress tracking.

> **Commercial Software / Source Code**
> This repository does not include API keys, production credentials, or real user data. Buyers provide and configure their own credentials, third-party services, and infrastructure according to the applicable license.

---

## 🚀 Educational Engine

```text
Upload Curriculum
       ↓
Analyze
       ↓
Generate
       ↓
Evaluate
       ↓
Teacher Review
       ↓
Publish
       ↓
Student Learning
       ↓
Assessment
       ↓
Mastery / Adaptive Learning
```

The architecture is designed around a controlled AI content pipeline where generated educational material can be evaluated and reviewed before publication.

---

## ✨ Core Capabilities

### 🧠 AI Educational Engine

- Curriculum and source analysis
- AI-powered lesson and content generation
- Source-grounded generation
- Automated content evaluation
- Teacher approval workflow
- Foundation for adaptive and mastery-based learning

### 👨‍🏫 Teacher Experience

- Course and lesson management foundation
- Content review and approval workflow
- Assessment and quiz capabilities
- Student progress tracking
- Publishing workflow

### 👨‍🎓 Student Experience

- Structured learning content
- Assessments and quizzes
- Progress tracking
- Foundation for personalized learning

### 🏢 Multi-Tenant Architecture

- Foundation for schools and education institutions
- Tenant-isolation architecture and tests
- Organization-level data boundaries
- Suitable foundation for commercial education deployments

### 🤖 AI Integrations

- OpenAI integration
- Multimodal tutoring foundation
- Realtime voice foundation
- AI usage controls
- Production configuration patterns

### 🔐 Security & Commercial Infrastructure

- Email verification / password reset foundation
- MFA / TOTP
- Payments with signed webhook verification
- S3 production storage integration
- Tenant-isolation tests
- Rate limiting
- Security middleware

### 🧪 Engineering & Operations

- GitHub Actions CI
- Unit and evaluation tests
- Integration tests
- Browser E2E testing with Playwright
- Security and dependency checks
- Backup / restore tooling
- OpenTelemetry foundation
- Staging / production release gates
- Release and rollback runbook

---

## 📊 Feature Status

The repository intentionally distinguishes production-oriented integrations from architectural foundations. Verify the implementation in the source before representing a capability as fully production-ready.

| Module | Status |
|---|---|
| Curriculum analysis | 🟢 Implemented capability |
| AI content generation | 🟢 Implemented capability |
| Source grounding | 🟢 Implemented capability |
| Content evaluation | 🟢 Implemented capability |
| Teacher review workflow | 🟢 Implemented capability |
| Assessments | 🟢 Implemented capability |
| Progress tracking | 🟢 Implemented capability |
| Multi-tenancy | 🟡 Foundation / integration dependent |
| Adaptive / mastery learning | 🟡 Foundation |
| Multimodal tutoring | 🟡 Foundation |
| Realtime voice | 🟡 Foundation |
| MFA / TOTP | 🟢 Implemented capability |
| Payments / signed webhooks | 🟢 Integration |
| S3 storage | 🟢 Integration |
| Observability | 🟡 Foundation |

> **Note:** Status labels describe the current product positioning and should be kept aligned with the actual implementation as the codebase evolves.

---

## 🏗️ Architecture

At a high level, the platform connects the user-facing educational experience with AI services, persistence, storage, payments, and observability infrastructure.

```text
┌─────────────────────────────┐
│     Teacher / Student       │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│       EduAI Application      │
├─────────────────────────────┤
│ Auth │ AI │ Courses │ Exams │
│ Tenants │ Progress │ Admin  │
└──────────────┬──────────────┘
               ↓
┌──────────────┼──────────────┐
│ PostgreSQL   │ S3           │
│ OpenAI       │ Stripe       │
│ OpenTelemetry│              │
└─────────────────────────────┘
```

The exact implementation and module layout should be treated as the source of truth.

---

## 📦 What You Get

The commercial source-code package is intended to include:

- Full project source code
- AI educational engine components
- Teacher / student architecture
- Authentication and security components
- Assessment capabilities
- AI integrations
- Payment and storage integrations where configured
- Automated testing setup
- CI/CD configuration
- Operational documentation
- Release and rollback guidance
- Environment configuration template
- Commercial license

### ❌ What Is Not Included

- OpenAI API keys
- Stripe secrets
- AWS credentials
- Email provider credentials
- Production database credentials
- Real user data
- Cloud hosting or infrastructure costs
- Third-party service subscriptions

---

## 🛠️ Local Development

### Requirements

- Node.js 20+
- PostgreSQL for database-dependent features
- Credentials for any external services you want to enable

### Install

```bash
npm install
```

### Start the application

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

### Start background workers

```bash
npm run worker
```

---

## ⚙️ Environment Variables

Use `.env` for local development and a Secret Manager for Staging / Production.

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/eduai
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-5-mini
STRIPE_SECRET_KEY=your_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
S3_BUCKET=your_bucket
S3_REGION=your_region
OTEL_EXPORTER_OTLP_ENDPOINT=optional_endpoint
```

**Never commit secrets to Git.**

---

## 🧪 Testing

Run the available test suites before release:

```bash
npm test
npm run test:integration
npm run test:e2e
```

For browser E2E, the project uses Playwright where configured.

---

## 🏗️ Staging / Production Release Flow

Before production deployment:

```text
CI Green
  ↓
Staging Smoke + E2E
  ↓
Tenant Isolation
  ↓
Auth / MFA
  ↓
Payment Webhooks
  ↓
AI / Multimodal / Voice
  ↓
Backup + Restore Drill
  ↓
Monitoring + Alerts
  ↓
Load / Security Review
  ↓
Production
```

Review `ops/RELEASE_RUNBOOK.md` before delivering a release.

---

## 💳 Commercial Product

EduAI is positioned as a **Source Code / Commercial Software Starter**, not as a hosted SaaS subscription for end users.

The buyer receives the source code, documentation, and configuration templates covered by the selected license, and provides their own credentials, infrastructure, and third-party service accounts.

### Suggested Pricing

- **Launch:** $499
- **After product validation and customer reviews:** $799+
- **White-label / custom deployment:** Custom pricing based on scope

> Pricing is a commercial positioning guideline and may change independently of the source code.

---

## 🔒 Security

Never include the following in the repository:

- OpenAI API keys
- Stripe secrets
- AWS credentials
- Email provider credentials
- Production database credentials
- Real user or student data

Use environment variables or a dedicated Secret Manager instead.

---

## 📄 License

Commercial deployments should include a clear **Commercial License** defining permitted use, modification, redistribution, resale, deployment, and any applicable user or organization limits.

The license terms are the legal source of truth for what a buyer may and may not do with the software.

---

## 📦 Release Checklist

Before delivering a release:

1. Run `npm test`.
2. Run integration and E2E tests.
3. Review `ops/RELEASE_RUNBOOK.md`.
4. Confirm that no secrets are present in Git history or the release.
5. Create a clear release/tag.
6. Deliver the source code, documentation, license, and `.env.example`.

---

## 🎯 Positioning

EduAI is intended to serve as a strong starting point for building commercial AI-powered education products, while leaving infrastructure credentials, deployment decisions, and final production configuration under the buyer's control.
