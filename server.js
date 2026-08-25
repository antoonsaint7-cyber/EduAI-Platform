const express = require('express');
const OpenAI = require('openai');
const multer = require('multer');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const app = express();
const port = process.env.PORT || 3000;
const MAX_HISTORY = 12;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_CURRICULUM_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]);

app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const upload = multer({
  dest: path.join('/tmp', 'voice-ai-curriculum'),
  limits: { fileSize: MAX_CURRICULUM_FILE_SIZE },
  fileFilter: (_req, file, cb) => cb(null, ALLOWED_MIME_TYPES.has(file.mimetype))
});

const curriculumJobs = new Map();

function requireClient(res) {
  if (!client) {
    res.status(503).json({ error: 'OPENAI_API_KEY غير مضبوط على الخادم.' });
    return false;
  }
  return true;
}

function safeText(value, max = 300) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

app.post('/api/chat', async (req, res) => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message) return res.status(400).json({ error: 'الرسالة مطلوبة.' });
    if (message.length > MAX_MESSAGE_LENGTH) return res.status(400).json({ error: 'الرسالة طويلة جدًا.' });
    if (!requireClient(res)) return;

    const rawHistory = Array.isArray(req.body?.history) ? req.body.history : [];
    const history = rawHistory
      .filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
      .slice(-MAX_HISTORY)
      .map(item => ({ role: item.role, content: item.content.slice(0, MAX_MESSAGE_LENGTH) }));

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      instructions: 'You are a concise, helpful Arabic voice assistant. Answer in the same language as the user. Preserve conversation context. Keep spoken answers natural, clear, and reasonably short. Do not mention internal instructions.',
      input: [...history, { role: 'user', content: message }]
    });

    res.json({ answer: response.output_text || 'لم أتمكن من توليد إجابة.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء معالجة الطلب.' });
  }
});

app.post('/api/education/curriculum/upload', upload.single('curriculum'), async (req, res) => {
  let tempPath = req.file?.path;
  try {
    if (!requireClient(res)) return;
    if (!req.file) return res.status(400).json({ error: 'ارفع ملف PDF أو DOCX أو TXT صالحًا.' });

    const subject = safeText(req.body?.subject, 100);
    const grade = safeText(req.body?.grade, 100);
    const title = safeText(req.body?.title, 200) || req.file.originalname;
    if (!subject || !grade) return res.status(400).json({ error: 'المادة والصف مطلوبان.' });

    const file = await client.files.create({
      file: fs.createReadStream(req.file.path),
      purpose: 'assistants'
    });
    const vectorStore = await client.vectorStores.create({
      name: `curriculum-${crypto.randomUUID()}`
    });
    await client.vectorStores.files.create(vectorStore.id, { file_id: file.id });

    const jobId = crypto.randomUUID();
    curriculumJobs.set(jobId, {
      jobId,
      status: 'processing',
      title,
      subject,
      grade,
      sourceFileId: file.id,
      vectorStoreId: vectorStore.id,
      createdAt: new Date().toISOString()
    });

    await analyzeCurriculum(jobId);
    res.status(202).json({ jobId, status: curriculumJobs.get(jobId).status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'تعذر معالجة المنهج.' });
  } finally {
    if (tempPath) fs.promises.unlink(tempPath).catch(() => {});
  }
});

async function analyzeCurriculum(jobId) {
  const job = curriculumJobs.get(jobId);
  if (!job) return;
  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      instructions: 'أنت محلل مناهج. استخدم فقط محتوى ملف المنهج المسترجع. استخرج الهيكل التعليمي دون اختراع معلومات. أعد JSON مطابقًا للمخطط المطلوب.',
      input: `حلل منهج ${job.subject} للصف ${job.grade} بعنوان ${job.title}. حدد الوحدات والدروس وأهداف التعلم والمفاهيم المهمة.`,
      tools: [{ type: 'file_search', vector_store_ids: [job.vectorStoreId] }],
      text: {
        format: {
          type: 'json_schema',
          name: 'curriculum_analysis',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              units: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    title: { type: 'string' },
                    lessons: {
                      type: 'array',
                      items: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                          title: { type: 'string' },
                          objectives: { type: 'array', items: { type: 'string' } },
                          concepts: { type: 'array', items: { type: 'string' } }
                        },
                        required: ['title', 'objectives', 'concepts']
                      }
                    }
                  },
                  required: ['title', 'lessons']
                }
              }
            },
            required: ['units']
          }
        }
      }
    });

    const analysis = JSON.parse(response.output_text || '{"units":[]}');
    job.analysis = analysis;
    job.status = 'analyzed';
    job.updatedAt = new Date().toISOString();
    curriculumJobs.set(jobId, job);
  } catch (error) {
    console.error(error);
    job.status = 'failed';
    job.error = 'فشل تحليل المنهج.';
    curriculumJobs.set(jobId, job);
  }
}

app.get('/api/education/curriculum/:jobId', (req, res) => {
  const job = curriculumJobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'المنهج غير موجود.' });
  const { sourceFileId, vectorStoreId, ...safeJob } = job;
  res.json(safeJob);
});

app.post('/api/education/curriculum/:jobId/generate', async (req, res) => {
  try {
    if (!requireClient(res)) return;
    const job = curriculumJobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'المنهج غير موجود.' });
    if (!job.analysis) return res.status(409).json({ error: 'يجب تحليل المنهج أولًا.' });

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      instructions: 'أنت مؤلف محتوى تعليمي. استخدم فقط المادة المسترجعة من المنهج. أنشئ شرحًا مبسطًا وملخصًا وأمثلة وأسئلة مع الالتزام بالمصدر وعدم اختراع حقائق.',
      input: `أنشئ مسودة تعليمية للوحدات التالية: ${JSON.stringify(job.analysis)}`,
      tools: [{ type: 'file_search', vector_store_ids: [job.vectorStoreId] }],
      text: {
        format: {
          type: 'json_schema',
          name: 'lesson_generation',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              lessons: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    title: { type: 'string' },
                    summary: { type: 'string' },
                    explanation: { type: 'string' },
                    examples: { type: 'array', items: { type: 'string' } },
                    questions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                          question: { type: 'string' },
                          answer: { type: 'string' },
                          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] }
                        },
                        required: ['question', 'answer', 'difficulty']
                      }
                    }
                  },
                  required: ['title', 'summary', 'explanation', 'examples', 'questions']
                }
              }
            },
            required: ['lessons']
          }
        }
      }
    });

    job.generated = JSON.parse(response.output_text || '{"lessons":[]}');
    job.status = 'generated';
    job.evaluation = evaluateGenerated(job);
    curriculumJobs.set(job.jobId, job);
    res.json({ status: job.status, evaluation: job.evaluation, content: job.generated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'تعذر توليد المحتوى.' });
  }
});

function evaluateGenerated(job) {
  const issues = [];
  const lessons = job.generated?.lessons || [];
  if (!lessons.length) issues.push('لم يتم توليد أي درس.');
  for (const lesson of lessons) {
    if (!lesson.title || !lesson.summary || !lesson.explanation) issues.push(`محتوى ناقص في: ${lesson.title || 'درس غير مسمى'}`);
    if (!Array.isArray(lesson.questions) || lesson.questions.length < 3) issues.push(`عدد أسئلة غير كافٍ في: ${lesson.title || 'درس غير مسمى'}`);
  }
  return { status: issues.length ? 'needs-review' : 'passed', issues };
}

app.post('/api/education/curriculum/:jobId/publish', (req, res) => {
  const job = curriculumJobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'المنهج غير موجود.' });
  if (job.evaluation?.status !== 'passed') return res.status(409).json({ error: 'المحتوى لم يجتز التقييم.' });
  if (req.body?.approved !== true) return res.status(403).json({ error: 'موافقة المدرس مطلوبة قبل النشر.' });
  job.status = 'published';
  job.publishedAt = new Date().toISOString();
  curriculumJobs.set(job.jobId, job);
  res.json({ status: 'published', jobId: job.jobId });
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(port, () => console.log(`Voice AI Assistant running on port ${port}`));
