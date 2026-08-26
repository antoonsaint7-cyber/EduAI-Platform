# EduAI Platform 🎓🤖

منصة تعليمية عربية تعتمد على الذكاء الاصطناعي، مع نواة قابلة للتوسع للمدرس والطالب والمؤسسات.

> **Commercial Source Code**: لا توجد مفاتيح API أو بيانات إنتاج داخل المستودع. كل عميل يستخدم credentials والبنية التحتية الخاصة به.

## ما تم تنفيذه

### 🤖 AI Tutor
- OpenAI Responses API على الخادم فقط.
- تعليم عربي وسياق محادثة محدود وآمن.
- Student/Teacher prompting منفصل داخل `src/education.js`.
- حماية من اعتبار محتوى المنهج تعليمات للنظام.
- Speech Recognition وText-to-Speech في المتصفح.

### 👨‍🏫 Teacher / 👨‍🎓 Student
- حسابات وصلاحيات teacher/student.
- جلسات HttpOnly موقعة بتوكن عشوائي مخزن كـhash.
- لوحة Dashboard بسيطة.
- إنشاء درس → review → publish.
- الطالب يرى الدروس المنشورة فقط.
- تسجيل درجات ومحاولات وMastery.

### 🏢 Multi-tenant foundation
- PostgreSQL schema للمؤسسات والمستخدمين والدروس والتقييمات والتقدم.
- كل عمليات الدروس والتقدم مقيدة بـ`tenant_id`.
- معاملات قاعدة البيانات أثناء إنشاء المؤسسة والحساب.

### 🔐 Security
- لا secrets داخل الكود أو الواجهة.
- Password hashing باستخدام Node.js `scrypt` مع salt عشوائي.
- Rate limiting للـauth/chat/write APIs.
- Security headers وHSTS في production.
- Input length/type validation.
- Stripe webhook signature verification + idempotency table.

### 🧪 Engineering
- Unit tests حقيقية للـprompting وpassword hashing.
- API smoke test.
- Offline educational evals.
- GitHub Actions CI.
- Dependency audit.

## التشغيل

المتطلبات: Node.js 20+ وPostgreSQL.

```bash
npm install
cp .env.example .env
npm run db:migrate
npm start
```

ثم افتح `http://localhost:3000`.

- المساعد: `/`
- التعليم: `/education.html`
- لوحة التحكم: `/dashboard.html`

## Environment

استخدم `.env.example` كقالب. لا تضع أسرارًا في Git.

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

الـCI يشغّل الاختبارات وAPI smoke وeducational evals و`npm audit`.

## الإنتاج

قبل أي Production deployment يجب توفير:

1. PostgreSQL managed + encrypted backups.
2. HTTPS وSecret Manager.
3. Email provider لتنفيذ email verification/password reset فعليًا.
4. MFA/TOTP إذا كان مطلوبًا للـtenant policy.
5. Stripe products/prices وربط أحداث الاشتراك بالـtenant entitlement.
6. S3-compatible storage إذا تم تفعيل رفع المستندات، مع file validation وvirus scanning.
7. OpenTelemetry/monitoring/alerts وload/security testing.
8. Runbook للـbackup/restore وrollback.

هذه الخدمات **ليست مزيفة داخل الكود**: لا يتم الادعاء بأنها تعمل قبل ربط البنية التحتية والcredentials الخاصة بالعميل.

## المنتج عند البيع

النسخة مناسبة كـ**Commercial Educational AI Starter / Source Code**. لا تُسوّقها كـSaaS production مكتمل قبل تنفيذ متطلبات قسم الإنتاج أعلاه.

## License

أضف Commercial License واضحة قبل التوزيع التجاري، تحدد الاستخدام وإعادة التوزيع وإعادة البيع والحدود الخاصة بالمستخدمين والمؤسسات.
