# EduAI Platform 🎓🤖

منصة تعليمية عربية تعتمد على الذكاء الاصطناعي، مبنية كنواة قابلة للتوسع للمدرس والطالب والمؤسسات.

> **Commercial Source Code**: المستودع لا يحتوي على مفاتيح API أو بيانات إنتاج. بيانات الاعتماد والبنية التحتية الخاصة بالإنتاج يتم توفيرها من العميل.

## الحالة الفعلية للمشروع

هذه النسخة هي **Educational AI Starter / Source Code** وليست SaaS Production مكتملة. الوصف أدناه يقتصر على ما هو موجود في المستودع ويمكن اختباره حاليًا، بينما متطلبات الإنتاج موضحة في قسم منفصل.

## ما تم تنفيذه حاليًا

### 🤖 AI Tutor
- تكامل OpenAI Responses API من الخادم.
- محادثة تعليمية مع حدود لحجم المدخلات والسياق.
- Prompts تعليمية منفصلة للطالب والمدرس.
- حماية من التعامل مع محتوى المنهج كتعليمات نظام.
- Speech Recognition وText-to-Speech داخل المتصفح كميزات اختيارية.

### 👨‍🏫 Teacher / 👨‍🎓 Student
- حسابات وأدوار teacher/student.
- جلسات HttpOnly مع token عشوائي مخزن كـhash.
- Dashboard أساسية.
- دورة الدرس: إنشاء → review → publish.
- الطالب يستطيع الوصول إلى الدروس المنشورة.
- تسجيل محاولات ودرجات وبيانات mastery ضمن النواة الحالية.

### 🏢 Multi-tenant foundation
- مخطط PostgreSQL للمؤسسات والمستخدمين والدروس والتقييمات والتقدم.
- عمليات التعليم والتقدم الحالية مرتبطة بـ`tenant_id`.
- معاملات قاعدة البيانات للعمليات التي تتطلب اتساقًا بين أكثر من سجل.

### 🔐 Security
- عدم تضمين API secrets داخل الواجهة أو المستودع.
- Password hashing باستخدام Node.js `scrypt` مع salt عشوائي.
- Rate limiting لنقاط auth/chat/write الحالية.
- Security headers وHSTS في production.
- التحقق من نوع وحجم المدخلات.
- التحقق من توقيع Stripe webhook ووجود آلية idempotency في النواة الحالية.

### 🧪 Engineering
- Unit tests للوظائف الأساسية.
- API smoke test.
- Offline educational evaluations.
- GitHub Actions CI.
- Dependency audit.

## التشغيل محليًا

المتطلبات: Node.js 20+ وPostgreSQL.

```bash
npm install
cp .env.example .env
npm run db:migrate
npm start
```

ثم افتح `http://localhost:3000`.

المسارات الحالية:
- `/` للواجهة الرئيسية.
- `/education.html` للواجهة التعليمية.
- `/dashboard.html` للـDashboard.

## Environment

استخدم `.env.example` كقالب ولا تضع الأسرار في Git.

المتغيرات الأساسية:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/eduai
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-5-mini
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

## الاختبارات

```bash
npm test
npm run test:e2e
node evals/run-evals.mjs
```

GitHub Actions يشغّل الاختبارات وAPI smoke وeducational evaluations وdependency audit.

## ما يحتاج إعداد Production فعلي

هذه البنود **ليست مكونات SaaS مكتملة بمجرد وجود إعداداتها في `.env`**. قبل تشغيل المنصة كخدمة تجارية Production يجب تنفيذ وربط ما يلزم منها:

1. PostgreSQL مُدار مع encrypted backups واختبار restore.
2. HTTPS وSecret Manager.
3. Email provider فعلي لـemail verification وpassword reset.
4. MFA/TOTP إذا كانت سياسة المؤسسة تتطلبه.
5. Stripe products/prices وربط أحداث الاشتراك فعليًا بصلاحيات المؤسسة.
6. S3-compatible storage إذا تم تفعيل رفع المستندات، مع file validation وvirus scanning.
7. OpenTelemetry وmonitoring وalerts، بالإضافة إلى load/security testing.
8. Runbook للـbackup/restore والـrollback.
9. مراجعة أمنية مستقلة قبل تعريض النظام لبيانات طلاب حقيقية.

## طريقة تسويق المشروع

الوصف الدقيق للبيع هو:

**EduAI Platform — Commercial Educational AI Starter / Source Code**

يمكن استخدامه كنواة لبناء منصة تعليمية تجارية، لكن لا ينبغي تقديمه على أنه SaaS Production مكتمل قبل تنفيذ متطلبات الإنتاج المذكورة أعلاه.

## License

قبل التوزيع التجاري، أضف Commercial License واضحة تحدد الاستخدام وإعادة التوزيع وإعادة البيع وحدود المستخدمين والمؤسسات.
