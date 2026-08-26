# EduAI Platform 🎓🤖

**Commercial Educational AI Starter / Source Code** لبناء منصات تعليمية مدعومة بالذكاء الاصطناعي للمدرسين والطلاب والمؤسسات.

> **الحالة الحالية:** المشروع Starter / Source Code قابل للتطوير، وليس SaaS Production مستضافًا وجاهزًا للاشتراك مباشرة.

## لماذا EduAI؟

نواة عملية تجمع بين الذكاء الاصطناعي، إدارة الدروس، أدوار المدرس والطالب، الاختبارات، وتتبع التقدم في مشروع واحد قابل للتخصيص. الهدف هو اختصار وقت بناء الـMVP والنواة الخلفية لمنصة EdTech بدل البدء من الصفر.

## ✨ الميزات الموجودة حاليًا

### 🤖 AI Tutor
- تكامل OpenAI Responses API من الخادم.
- محادثة تعليمية مع حدود لحجم المدخلات والسياق.
- Prompts تعليمية منفصلة للطالب والمدرس.
- حماية من التعامل مع محتوى المنهج كتعليمات نظام.
- Speech Recognition وText-to-Speech داخل المتصفح كميزات اختيارية.

### ✦ AI Lesson & Course Generator
- توليد درس منظم بأهداف وأقسام وأمثلة وأسئلة مراجعة.
- توليد خطة كورس من 3 إلى 8 دروس.
- حفظ مخرجات الكورس كمسودات دروس للمراجعة قبل النشر.
- دعم إدخال مصدر تعليمي اختياري لتحسين الملاءمة.

### 📝 AI Quiz Generator
- توليد اختبارات من 5 إلى 15 سؤالًا من محتوى الدرس.
- أنواع أسئلة قابلة للتصحيح تلقائيًا.
- حفظ الاختبار في PostgreSQL.
- تصحيح server-side وإرجاع النتيجة والتفسير.
- تحديث Mastery تلقائيًا بعد محاولة الطالب.

### 👨‍🏫 Teacher & 👨‍🎓 Student
- أدوار teacher/student.
- جلسات HttpOnly مع token عشوائي مخزن كـhash.
- Teacher Dashboard موسعة للمحتوى والاختبارات والتحليلات.
- Student Dashboard للتعلم والاختبارات والتقدم.
- دورة الدرس: إنشاء → review → publish.
- الطالب يصل إلى الدروس المنشورة فقط.

### 📊 Learning Analytics
- متوسط Mastery للمؤسسة.
- عدد الدروس والطلاب وحالة المحتوى.
- تحديد الطلاب ذوي الإتقان المنخفض.
- مؤشرات حسب المادة.
- للطالب: الدروس التي بدأها، متوسط الإتقان، أفضل درجة، وعدد المحاولات.

### 🏢 Multi-tenant Foundation
- مخطط PostgreSQL للمؤسسات والمستخدمين والدروس والتقييمات والتقدم.
- ربط عمليات التعليم والتقدم بـ`tenant_id` ضمن النواة الحالية.
- معاملات قاعدة البيانات للعمليات التي تتطلب اتساقًا بين أكثر من سجل.

### 🔐 Security Foundation
- لا توجد API secrets داخل الواجهة أو المستودع.
- Password hashing باستخدام Node.js `scrypt` مع salt عشوائي.
- Rate limiting لنقاط auth/chat/write/AI الحالية.
- Security headers وHSTS في production.
- التحقق من نوع وحجم المدخلات.
- التحقق من توقيع Stripe webhook وآلية idempotency في النواة الحالية.

### 🧪 Engineering
- Unit tests للوظائف الأساسية ومخرجات AI JSON normalization.
- API smoke test.
- Offline educational evaluations.
- GitHub Actions CI.
- Dependency audit.

## 🖥️ الواجهات الحالية

- `/` — الصفحة الرئيسية والمساعد الذكي.
- `/education.html` — الواجهة التعليمية.
- `/dashboard.html` — Teacher/Student Dashboard.

## 🚀 التشغيل محليًا

### المتطلبات
- Node.js 20+
- PostgreSQL
- OpenAI API key لميزات التوليد والمحادثة.

```bash
npm install
cp .env.example .env
npm run db:migrate
npm start
```

ثم افتح:

`http://localhost:3000`

## ⚙️ Environment

استخدم `.env.example` كقالب ولا تضع الأسرار في Git.

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/eduai
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-5-mini
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

## 🧪 الاختبارات

```bash
npm test
npm run test:e2e
node evals/run-evals.mjs
```

GitHub Actions يشغّل اختبارات المشروع وAPI smoke وeducational evaluations وdependency audit.

## 📦 ماذا يحصل عليه المشتري؟

- Source code للمشروع.
- AI Tutor foundation.
- AI Lesson/Course Generator.
- AI Quiz Generator مع server-side grading.
- Teacher/Student Dashboard.
- Learning Analytics وMastery foundation.
- PostgreSQL schema وmulti-tenant foundation.
- Authentication وsecurity foundation.
- Automated tests وCI.
- إمكانية تخصيص الكود وإضافة خدمات الإنتاج حسب احتياج المشروع.

**مهم:** هذا المنتج هو Source Code / Starter. تكاليف الاستضافة والخدمات الخارجية ومفاتيح API والبنية التحتية ليست مضمنة تلقائيًا.

## 🏭 متطلبات Production / SaaS

لتحويل النواة الحالية إلى SaaS مستضاف ومتاح للاشتراك، يجب استكمال وربط متطلبات الإنتاج التالية بحسب نموذج العمل:

1. PostgreSQL مُدار مع encrypted backups واختبار restore.
2. HTTPS وSecret Manager.
3. Email provider فعلي لـemail verification وpassword reset.
4. MFA/TOTP إذا كانت سياسة المؤسسة تتطلبه.
5. Stripe products/prices وربط أحداث الاشتراك فعليًا بصلاحيات المؤسسة.
6. S3-compatible storage إذا تم تفعيل رفع المستندات، مع file validation وvirus scanning.
7. OpenTelemetry وmonitoring وalerts، بالإضافة إلى load/security testing.
8. Runbook للـbackup/restore والـrollback.
9. مراجعة أمنية مستقلة قبل تعريض النظام لبيانات طلاب حقيقية.

هذه المتطلبات **ليست مدعاة على أنها مكتملة لمجرد وجود إعدادات أو Foundation في المستودع**.

## 🗺️ Roadmap

### المرحلة الحالية
- [x] AI Tutor foundation
- [x] AI Lesson/Course Generator
- [x] AI Quiz Generator + grading
- [x] Teacher/Student Dashboard
- [x] Learning Analytics foundation
- [x] PostgreSQL foundation
- [x] Authentication & security foundation
- [x] Tests & CI

### المرحلة التالية
- [ ] Admin/organization management الكامل.
- [ ] Billing & subscription entitlements.
- [ ] Production deployment.
- [ ] Monitoring, backups, security/load testing.
- [ ] E2E flow كامل من التسجيل حتى التقييم والدفع.

## 💼 الترخيص والاستخدام التجاري

الترخيص التجاري الأساسي موجود في [`COMMERCIAL-LICENSE.md`](COMMERCIAL-LICENSE.md). وهو ترخيص **Non-Exclusive**، أي يمكن بيع المشروع لأكثر من عميل، بينما يحصل كل عميل على حقوق الاستخدام والتعديل وفق شروط الترخيص والخطة التي اشتراها.

> **تنبيه:** راجع الترخيص مع محامٍ قبل التوزيع التجاري النهائي، خصوصًا فيما يتعلق بالاختصاص القضائي، الضرائب، حماية بيانات الطلاب، وحدود المسؤولية.

## 📌 Product positioning

**EduAI Platform — Commercial Educational AI Starter / Source Code**

مناسب للمطورين وشركات EdTech والمدارس التي تريد نواة تعليمية قابلة للتخصيص دون الادعاء بأنها SaaS Production مكتملة.
