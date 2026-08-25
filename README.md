# EduAI Platform 🎓🤖

منصة تعليمية تجارية مبنية على الذكاء الاصطناعي، هدفها تحويل المنهج الدراسي من ملف أو محتوى خام إلى تجربة تعليمية متكاملة للمدرس والطالب.

> **هذا المستودع مخصص لبيع Source Code كمنتج برمجي.** لا يحتوي على مفاتيح API أو بيانات إنتاج حقيقية. المشتري يضع credentials الخاصة به ويشغّل المنصة على بنيته التحتية وفق شروط الترخيص.

## 🚀 Educational Engine

المنصة مبنية حول pipeline أساسي:

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
- بنية منفصلة للمدرس والطالب.
- نشر المحتوى بعد المراجعة.
- اختبارات وتقييم.
- تتبع التقدم.
- أساس Multi-tenant للمدارس والمؤسسات.

### 🤖 AI Integrations
- OpenAI integration.
- Multimodal tutoring foundation.
- Realtime Voice foundation.
- AI usage controls and production configuration.

### 🔐 Commercial Platform
- Email verification / password reset foundation.
- MFA / TOTP.
- Payments + signed webhook verification.
- S3 production storage integration.
- Tenant-isolation tests.
- Rate limiting and security middleware.

### 🧪 Engineering & Operations
- GitHub Actions CI.
- Unit / evaluation tests.
- Integration tests.
- Browser E2E with Playwright.
- Security/dependency checks.
- Backup / restore tooling.
- OpenTelemetry foundation.
- Staging / Production release gates.
- Release and rollback runbook.

## 🛠️ التشغيل محليًا

المتطلبات:

- Node.js 20+
- PostgreSQL عند استخدام المزايا التي تعتمد على قاعدة البيانات.
- مفاتيح الخدمات المطلوبة للمزايا الخارجية.

ثبّت الاعتمادات:

```bash
npm install
```

شغّل التطبيق:

```bash
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

استخدم ملف `.env` محليًا أو Secret Manager في Staging/Production. لا تضع secrets داخل Git.

أمثلة على الإعدادات المستخدمة حسب المزايا:

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
S3_ENDPOINT=optional_endpoint
OTEL_EXPORTER_OTLP_ENDPOINT=optional_endpoint
```

> بعض الإعدادات تعتمد على الملفات والخدمات الموجودة في الإصدار. راجع ملفات التشغيل و`ops/` قبل النشر.

## 🧪 الاختبارات

```bash
npm test
```

اختبار التكامل:

```bash
npm run test:integration
```

اختبار المتصفح:

```bash
npm run test:e2e
```

## 🏗️ Production / Staging

قبل إطلاق نسخة Production يجب المرور عبر:

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

التفاصيل موجودة في:

- `ops/STAGING.md`
- `ops/PRODUCTION.md`
- `ops/RELEASE_RUNBOOK.md`

## 💳 طبيعة المنتج عند البيع

النسخة الحالية مهيأة للبيع كـ **Source Code / Commercial Software Starter**، وليست اشتراك SaaS جاهز للمستخدم النهائي.

المشتري يحصل على الكود والإعدادات والوثائق حسب الترخيص، ويستخدم مفاتيحه وخدماته وبنيته التحتية الخاصة.

### المقترح التجاري

- Launch price: **$499**
- بعد إثبات المنتج ومراجعات العملاء: **$799+**
- White-label / custom deployment: تسعير منفصل حسب نطاق العمل.

> الأسعار المقترحة ليست جزءًا من الترخيص تلقائيًا، ويجب تحديد شروط الترخيص والاستخدام وإعادة التوزيع في وثيقة License مستقلة.

## 🔒 Security

لا تُضمّن في المستودع:

- OpenAI API keys
- Stripe secrets
- AWS credentials
- Email provider credentials
- Production database credentials
- أي بيانات مستخدم حقيقية

استخدم Environment Variables أو Secret Manager.

## 📄 License

يجب أن يأتي الإصدار التجاري النهائي مع **Commercial License** واضحة تحدد الاستخدام، وإعادة التوزيع، وإعادة البيع، وعدد المنشآت/المستخدمين المسموح به حسب الباقة.

## 📦 Release

قبل تسليم نسخة للعميل:

1. شغّل `npm test`.
2. شغّل Integration وE2E.
3. راجع `ops/RELEASE_RUNBOOK.md`.
4. تأكد من عدم وجود secrets داخل Git.
5. أنشئ release/tag واضحًا.
6. سلّم Source Code + Documentation + License + `.env.example`.

## 📜 Disclaimer

هذا المشروع Software platform/source code وليس ضمانًا بأن كل خدمة خارجية أو بنية تحتية ستعمل دون إعداد. مسؤولية إعداد الحسابات، المفاتيح، الاستضافة، التكاليف، والامتثال القانوني تقع وفق شروط الترخيص والعقد المبرم مع العميل.
