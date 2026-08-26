# EduAI Platform 🎓🤖

**Commercial Educational AI Platform / Source Code** لبناء منصات EdTech للمدرسين والطلاب والمدارس.

## 🚀 الإصدار 4.0

EduAI انتقل من Commercial Educational AI Starter إلى قاعدة أقوى لبناء منتج EdTech تجاري، مع مسار واضح من V2 إلى V4.

### V2 — Adaptive Learning + RAG + Advanced Assessment
- AI Lesson/Course/Quiz generation.
- Server-side grading وتحديث Mastery.
- Topic-level mastery مع توصيات تعلم تكيفية.
- Tenant-isolated document ingestion وتقسيم المصادر إلى chunks.
- Retrieval API للمصادر التعليمية قبل دمجها مع توليد AI.
- 4 لغات للواجهة: العربية، English، Français، Español مع RTL/LTR.

### V3 — School Management + Billing
- Admin role وtenant administration APIs.
- خطط Free / Teacher / School / Enterprise.
- Subscription وusage counters وentitlements في PostgreSQL.
- Stripe Checkout session endpoint عند ضبط مفاتيح Stripe وأسعار المنتجات.
- Stripe webhook foundation مع توقيع وidempotency.

### V4 — Enterprise Security + Multi-Tenancy + Deployment
- Multi-tenant data model وعزل بالـtenant_id.
- Audit logs للعمليات الإدارية والتعليمية الحساسة.
- Session security وpassword hashing وrate limiting وsecurity headers.
- Docker production image وDocker Compose لتشغيل التطبيق مع PostgreSQL.
- فصل platform routes عن server الأساسي عبر production launcher.

## 🧑‍🏫 Teacher / Student
- Teacher Dashboard لإنشاء ومراجعة ونشر المحتوى.
- Student Dashboard للتعلم والاختبارات والتقدم.
- AI Tutor للشرح والمراجعة وخطط المذاكرة.
- Analytics للمؤسسة والطالب.

## 🌍 Multilingual
الواجهة الأساسية تدعم:
- 🇪🇬 العربية
- 🇬🇧 English
- 🇫🇷 Français
- 🇪🇸 Español

اللغة محفوظة محليًا، والعربية تستخدم RTL واللغات الأخرى LTR. دعم لغة AI نفسها يعتمد على prompt/model configuration.

## 🏗️ Architecture

```text
Web UI
  ↓
Express API
  ├── Auth / Sessions
  ├── Teacher / Student / Admin
  ├── AI Tutor + Content Generation
  ├── Adaptive Learning / Mastery
  ├── RAG ingestion + retrieval
  ├── Assessments / Grading
  ├── Billing / Entitlements
  └── Audit / Security
        ↓
PostgreSQL
```

## 🚀 تشغيل محلي

المتطلبات: Node.js 20+ وPostgreSQL.

```bash
npm install
cp .env.example .env
npm run db:migrate
npm start
```

ثم افتح `http://localhost:3000`.

### Docker

```bash
docker compose up --build
```

## ⚙️ Environment

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/eduai
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-5-mini
STRIPE_SECRET_KEY=your_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_SUCCESS_URL=https://your-domain.example/billing/success
STRIPE_CANCEL_URL=https://your-domain.example/billing/cancel
```

لا تضع الأسرار في Git.

## 🧪 Validation

```bash
npm test
npm run test:e2e
node evals/run-evals.mjs
```

GitHub Actions يشغّل الاختبارات وAPI smoke وeducational evaluations وdependency audit.

## 📦 ماذا يحصل عليه المشتري؟

- Source code كامل قابل للتخصيص.
- AI Tutor وAI content generation.
- Adaptive learning / mastery foundation.
- RAG-ready document ingestion and retrieval foundation.
- Advanced assessment + grading.
- Teacher / Student / Admin foundations.
- Analytics.
- Multi-tenancy.
- Billing / subscription / entitlement foundation.
- Authentication وsecurity foundation وaudit logs.
- Docker deployment artifacts.
- Tests وCI.
- 4-language UI foundation.

## ⚠️ Production boundary

وجود الـfoundation في الكود لا يعني أن SaaS Production أصبح مكتملًا تلقائيًا. قبل استخدام بيانات طلاب حقيقية يجب إعداد managed PostgreSQL/backups، Secret Manager، email verification/reset، MFA حسب السياسة، تخزين ملفات آمن، monitoring/alerts، load/security testing، runbooks، ومراجعة privacy/security مستقلة.

Stripe يحتاج Products/Prices ومفاتيح حقيقية، وRAG للملفات غير النصية يحتاج extraction/virus scanning/storage production مناسب.

## 💼 Commercial License

الترخيص الأساسي موجود في `COMMERCIAL-LICENSE.md` وهو **Non-Exclusive**، لذلك يمكن بيع الكود لعدة عملاء وفق شروط الترخيص. لا يمنح الشراء حق إعادة بيع أو إعادة توزيع Source Code نفسه.

راجع الترخيص قانونيًا قبل التوزيع التجاري النهائي.

## 🗺️ Roadmap

- [x] V2 Adaptive Learning + RAG-ready retrieval + Advanced Assessment
- [x] V3 School/Admin + Billing/Entitlements foundation
- [x] V4 Enterprise security/audit + Multi-tenancy + Docker deployment
- [ ] Production managed infrastructure
- [ ] Full PDF/DOCX/PPTX extraction worker + malware scanning + object storage
- [ ] Stripe webhook → subscription state synchronization and automated entitlement lifecycle
- [ ] Full E2E registration → learning → assessment → billing flow
- [ ] Independent security/privacy review

## 📌 Product positioning

**EduAI Platform — Commercial Educational AI Platform / Source Code**

قاعدة قابلة للتخصيص للمطورين وشركات EdTech والمدارس، مع فصل واضح بين قدرات الكود الحالية ومتطلبات تشغيل SaaS Production.
