# EduAI Platform 🎓🤖

**Commercial Educational AI Platform / Source Code** لبناء منصات EdTech للمدرسين والطلاب والمدارس.

## 🚀 الإصدار 4.2+

EduAI أصبح قاعدة متقدمة لبناء منتج EdTech تجاري، مع Adaptive Learning وRAG وAdvanced Exams وEnterprise SaaS controls وIntegrations.

### 🧠 Adaptive Learning & Student Intelligence
- Diagnostic assessment → Knowledge Profile → Weak Concepts → Personalized Content → Adaptive Questions → Mastery → Next Learning Path.
- Topic/skill mastery مع توصيات تعلم تكيفية.
- اختيار السؤال التالي حسب مستوى الطالب.
- Dynamic learning paths.

### 📚 RAG
- Tenant-isolated ingestion/chunking foundation.
- Metadata filtering وcitations.
- Hybrid retrieval foundation.
- Grounded-answer prompting لتقليل hallucination قدر الإمكان.
- Async processing architecture للملفات الكبيرة عبر Queue/Worker.
- Production deployments يمكنها استخدام PostgreSQL + pgvector.

### 📝 Advanced Exams
- Question bank.
- MCQ / True-False / Short Answer / Essay / Matching foundations.
- Difficulty وrandomization.
- Exam blueprints.
- Automatic grading.
- Rubric-ready assessment flow.
- Analytics وربط النتائج بالـMastery.

### 🏫 Enterprise SaaS
- Multi-tenancy وعزل البيانات بالـtenant_id.
- RBAC: SuperAdmin / SchoolAdmin / Teacher / Student.
- AI usage quotas حسب الخطة والـtenant.
- White-label branding: logo/colors/favicon.
- Custom-domain validation وtenant host resolution.
- Plans / subscriptions / entitlements foundation.

### 👨‍👩‍👧 Engagement & Student Experience
- Parent Portal foundation لمتابعة تقدم الطالب والتقييمات والتنبيهات والاشتراك.
- Gamification: XP / Levels / Badges / streaks.
- Exam integrity/proctoring event model وrisk scoring.
- Voice Tutor service contract لـSTT/TTS.

### ⚡ Performance & Async Architecture
- SSE streaming foundation لاستجابات AI التدريجية.
- Redis caching وdistributed rate limiting.
- BullMQ queue/worker architecture للمهام الخلفية.
- فصل API عن workers لمعالجة RAG والمهام الثقيلة.

### 🔗 Integrations
- LTI 1.3 launch-context foundation.
- SCORM 1.2 / 2004 adapter foundation.
- LMS adapter contracts لـMoodle / Canvas / Google Classroom.
- Payment adapter abstraction لـStripe / Paymob / Fawry / Tap.
- Bulk student-data validation/import foundation.
- Export contracts لـJSON / CSV / XLSX / PDF.

## 👨‍🏫 Teacher / Student
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

العربية تستخدم RTL واللغات الأخرى LTR. دعم لغة AI نفسها يعتمد على prompt/model configuration.

## 🏗️ Architecture

```text
Web UI
  ↓
Express API
  ├── Auth / RBAC / Multi-tenancy
  ├── Teacher / Student / Parent / Admin
  ├── AI Tutor + Content Generation + SSE
  ├── Adaptive Learning / Student Intelligence / Mastery
  ├── RAG ingestion → Queue → Worker → Retrieval
  ├── Assessments / Exams / Grading / Integrity
  ├── Billing / Entitlements / Usage Quotas
  ├── Integrations / LMS / Payments
  └── Audit / Security
        ↓
PostgreSQL + pgvector
        ↕
 Redis / BullMQ Workers
```

## 🚀 تشغيل محلي

المتطلبات: Node.js 20+ وPostgreSQL. ولتشغيل queues/caching في بيئة كاملة، استخدم Redis.

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
REDIS_URL=redis://localhost:6379
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
- Adaptive Learning / Student Intelligence foundation.
- RAG ingestion/retrieval + citations foundation.
- Advanced assessment + grading + exam integrity foundations.
- Parent Portal + Gamification foundations.
- Teacher / Student / Parent / Admin foundations.
- SSE + Redis + BullMQ architecture.
- Multi-tenancy + RBAC + usage quotas.
- White-label + custom-domain foundations.
- LTI/SCORM/LMS/payment integration adapters.
- Analytics.
- Billing / subscription / entitlement foundation.
- Authentication وsecurity foundation وaudit logs.
- Docker deployment artifacts.
- Tests وCI.
- 4-language UI foundation.

## ⚠️ Production boundary

وجود الـfoundation في الكود لا يعني أن SaaS Production أصبح مكتملًا تلقائيًا. قبل استخدام بيانات طلاب حقيقية يجب إعداد managed PostgreSQL/pgvector وbackups، Redis production، Secret Manager، object storage وmalware scanning للملفات، email verification/reset، MFA حسب السياسة، monitoring/alerts، load/security testing، runbooks، ومراجعة privacy/security مستقلة.

LTI/SCORM وMoodle/Canvas/Google Classroom وPaymob/Fawry/Tap تحتاج credentials وsandbox/production configuration لكل مزود. STT/TTS وproctoring/plagiarism تحتاج مزودي الخدمة أو integrations المناسبة. XLSX/PDF exporters الكاملة تحتاج تنفيذ exporter فعلي عند تفعيلها.

Stripe يحتاج Products/Prices ومفاتيح حقيقية، وRAG للملفات غير النصية يحتاج extraction pipeline production مناسب.

## 💼 Commercial License

الترخيص الأساسي موجود في `COMMERCIAL-LICENSE.md` وهو **Non-Exclusive**، لذلك يمكن بيع الكود لعدة عملاء وفق شروط الترخيص. لا يمنح الشراء حق إعادة بيع أو إعادة توزيع Source Code نفسه.

راجع الترخيص قانونيًا قبل التوزيع التجاري النهائي.

## 🗺️ Roadmap

- [x] Adaptive Learning + Student Intelligence foundation
- [x] RAG retrieval/chunking + async worker architecture
- [x] Advanced Exams + grading + integrity foundation
- [x] Parent Portal + Gamification + Voice Tutor contracts
- [x] SSE + Redis + BullMQ architecture
- [x] LTI/SCORM/LMS/payment integration foundations
- [x] Enterprise RBAC + quotas + white-label + custom domains foundation
- [ ] Production managed infrastructure
- [ ] Full PDF/DOCX/PPTX extraction + malware scanning + object storage
- [ ] Full external-provider integrations and credentials
- [ ] Complete XLSX/PDF exporters
- [ ] Full E2E registration → learning → assessment → billing flow
- [ ] Live public demo deployment
- [ ] Independent security/privacy review

## 📌 Product positioning

**EduAI Platform — Commercial Educational AI Platform / Enterprise EdTech Foundation**

قاعدة قابلة للتخصيص للمطورين وشركات EdTech والمدارس، مع فصل واضح بين قدرات الكود الحالية ومتطلبات تشغيل SaaS Production.