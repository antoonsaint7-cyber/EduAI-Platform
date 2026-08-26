# EduAI Platform 🎓🤖

منصة تعليمية تجارية مبنية بالذكاء الاصطناعي، تحول المنهج الدراسي من محتوى خام إلى تجربة تعليمية متكاملة للمدرس والطالب.

> **هذا المشروع يُباع كـ Source Code / Commercial Software.** لا يحتوي على مفاتيح API أو بيانات إنتاج حقيقية. المشتري يستخدم credentials والبنية التحتية الخاصة به وفق شروط الترخيص.

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

## ✨ المزايا

### 🧠 AI Educational Engine
- تحليل المناهج والمصادر.
- توليد الدروس والمحتوى.
- Grounding للمحتوى بالمصدر.
- Evaluation قبل النشر.
- Teacher approval workflow.
- أساس للتعلم التكيفي وMastery.

### 👨‍🏫 Teacher / 👨‍🎓 Student
- بنية للمدرس والطالب.
- نشر المحتوى بعد المراجعة.
- اختبارات وتقييم.
- تتبع تقدم الطلاب.
- Multi-tenant foundation للمدارس والمؤسسات.

### 🤖 AI Integrations
- OpenAI integration.
- Multimodal tutoring foundation.
- Realtime Voice foundation.
- AI usage controls وproduction configuration.

### 🔐 Commercial Platform
- Email verification / password reset foundation.
- MFA / TOTP.
- Payments + signed webhook verification.
- S3 production storage integration.
- Tenant-isolation tests.
- Rate limiting وsecurity middleware.

### 🧪 Engineering & Operations
- GitHub Actions CI.
- Unit / evaluation tests.
- Integration tests.
- Browser E2E باستخدام Playwright.
- Security/dependency checks.
- Backup / restore tooling.
- OpenTelemetry foundation.
- Staging / Production release gates.
- Release وrollback runbook.

## 🛠️ التشغيل محليًا

المتطلبات:

- Node.js 20+
- PostgreSQL للمزايا التي تعتمد على قاعدة البيانات.
- مفاتيح الخدمات المطلوبة للمزايا الخارجية.

```bash
npm install
npm start
```

ثم افتح:

```text
http://localhost:3000
```

للمهام الخلفية:

```bash
npm run worker
```

## ⚙️ Environment Variables

استخدم `.env` محليًا أو Secret Manager في Staging/Production.

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

**لا تضع أي secrets داخل Git.**

## 🧪 الاختبارات

```bash
npm test
npm run test:integration
npm run test:e2e
```

## 🏗️ Staging / Production

قبل الإطلاق:

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

راجع `ops/RELEASE_RUNBOOK.md` قبل تسليم أي إصدار.

## 💳 المنتج عند البيع

النسخة الحالية مهيأة للبيع كـ **Source Code / Commercial Software Starter**، وليست اشتراك SaaS جاهزًا للمستخدم النهائي.

المشتري يحصل على الكود والوثائق والإعدادات حسب الترخيص، ويستخدم مفاتيحه وخدماته وبنيته التحتية الخاصة.

### 💰 Commercial Pricing

- **Current Source Code License: $699**
- **Future launch price after Adaptive Learning + RAG + Advanced Exams: $999–$1,299**
- **White-label / custom deployment: $1,500–$3,000+** حسب نطاق العمل والتخصيص.
- **Enterprise deployment: $3,000–$5,000+** حسب المتطلبات والبنية والتكاملات.

> السعر الحالي البالغ **$699** هو سعر النسخة التجارية الحالية من Source Code، وليس سعر اشتراك SaaS أو تكلفة البنية التحتية والخدمات الخارجية.

## 🔒 Security

لا تُضمّن في المستودع:

- OpenAI API keys
- Stripe secrets
- AWS credentials
- Email provider credentials
- Production database credentials
- بيانات مستخدم حقيقية

استخدم Environment Variables أو Secret Manager.

## 📄 License

الإصدار التجاري يجب أن يتضمن **Commercial License** واضحة تحدد الاستخدام وإعادة التوزيع وإعادة البيع وأي حدود مرتبطة بالمستخدمين أو المؤسسات.

## 📦 Release Checklist

1. شغّل `npm test`.
2. شغّل Integration وE2E.
3. راجع `ops/RELEASE_RUNBOOK.md`.
4. تأكد من عدم وجود secrets داخل Git.
5. أنشئ release/tag واضحًا.
6. سلّم Source Code + Documentation + License + `.env.example`.
