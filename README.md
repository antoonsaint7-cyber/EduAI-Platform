# Voice AI Assistant 🎙️

مساعد صوتي بسيط يعمل من المتصفح ويستخدم OpenAI للإجابة، مع تحويل الكلام إلى نص ثم تحويل الإجابة إلى صوت.

## التشغيل

```bash
npm install
OPENAI_API_KEY=your_key npm start
```

ثم افتح `http://localhost:3000`.

### المتغيرات

- `OPENAI_API_KEY`: مفتاح OpenAI المطلوب للردود.
- `OPENAI_MODEL`: اختياري، والافتراضي `gpt-5-mini`.
- `PORT`: اختياري، والافتراضي `3000`.

> لا تضع مفتاح API داخل ملفات الواجهة أو GitHub. استخدم متغيرات البيئة/Secrets.

## الاختبار

```bash
npm test
```

## ملاحظات

التعرف على الكلام يعتمد على دعم المتصفح لـ Web Speech API، بينما النطق يعتمد على Speech Synthesis في المتصفح.
