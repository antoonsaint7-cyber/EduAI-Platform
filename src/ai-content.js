const { buildEducationalPrompt } = require('./education');

function cleanJson(text) {
  const raw = String(text || '').trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced ? fenced[1].trim() : raw;
}

async function generateJson({ client, model, instruction, schemaName }) {
  if (!client) {
    const error = new Error('OPENAI_API_KEY غير مضبوط على الخادم.');
    error.code = 'OPENAI_NOT_CONFIGURED';
    throw error;
  }

  const response = await client.responses.create({
    model: model || process.env.OPENAI_MODEL || 'gpt-5-mini',
    instructions: `${instruction}\nReturn valid JSON only. Do not include markdown fences or commentary.`,
    input: 'أنت محرر محتوى تعليمي محترف. اجعل المحتوى عربيًا واضحًا، دقيقًا، ومناسبًا للمستوى المحدد. لا تخترع حقائق خاصة بمنهج غير موجود في المدخلات. أشر إلى الحاجة لمراجعة المعلم عند نقص المصدر.',
  });

  let parsed;
  try {
    parsed = JSON.parse(cleanJson(response.output_text));
  } catch {
    const error = new Error(`تعذر تحليل ناتج ${schemaName} من النموذج.`);
    error.code = 'AI_INVALID_JSON';
    throw error;
  }
  return parsed;
}

async function generateLesson({ client, model, title, subject, level, goals, sourceText }) {
  return generateJson({
    client, model, schemaName: 'lesson',
    instruction: buildEducationalPrompt({
      mode: 'teacher', subject, level, action: 'explain', text: `المطلوب إنشاء درس بعنوان: ${title}. أهداف التعلم: ${goals}. المصدر المتاح: ${sourceText || 'لا يوجد مصدر، استخدم معرفة عامة فقط ولا تدّعِ أنها من منهج محدد.'}`,
    }) + `\nأعد JSON بالشكل: {"title":"","summary":"","objectives":[""],"sections":[{"heading":"","body":""}],"examples":[""],"quick_check":[{"question":"","answer":""}],"homework":[""]}`,
  });
}

async function generateCourse({ client, model, title, subject, level, lessonCount, sourceText }) {
  const count = Math.min(8, Math.max(3, Number(lessonCount) || 5));
  return generateJson({
    client, model, schemaName: 'course',
    instruction: `أنشئ خطة كورس تعليمية بعنوان "${title}" للمادة "${subject}" والمستوى "${level}" بعدد ${count} دروس. المصدر المتاح: ${sourceText || 'لا يوجد مصدر محدد.'}\nأعد JSON بالشكل: {"title":"","description":"","learning_outcomes":[""],"lessons":[{"title":"","objective":"","summary":"","estimated_minutes":30}],"recommended_assessment":""}`,
  });
}

async function generateQuiz({ client, model, title, subject, level, lessonContent, questionCount }) {
  const count = Math.min(15, Math.max(5, Number(questionCount) || 10));
  return generateJson({
    client, model, schemaName: 'quiz',
    instruction: `أنشئ اختبارًا من ${count} سؤالًا مرتبطًا بالدرس التالي. العنوان: ${title}. المادة: ${subject}. المستوى: ${level}. محتوى الدرس: ${lessonContent}\nاستخدم أنواع multiple_choice وtrue_false فقط حتى يمكن التصحيح تلقائيًا. أعد JSON بالشكل: {"title":"","instructions":"","questions":[{"type":"multiple_choice","question":"","options":["","","",""],"answer_index":0,"explanation":""}]}`,
  });
}

module.exports = { cleanJson, generateLesson, generateCourse, generateQuiz };
