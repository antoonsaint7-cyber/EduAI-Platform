const { query, withTransaction } = require('./db');
const OpenAI = require('openai');
const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

async function createCurriculum({ tenantId, teacherId, title, sourceText }) {
  const { rows } = await query('INSERT INTO curricula(tenant_id,teacher_id,title,source_text,status) VALUES($1,$2,$3,$4,\'draft\') RETURNING *',[tenantId,teacherId,title,sourceText]);
  return rows[0];
}
async function analyzeCurriculum(curriculum) {
  if (!client) throw new Error('OPENAI_API_KEY is required');
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
    instructions: 'You are an instructional designer. Analyze curriculum source and return JSON with learningObjectives, units, lessons and assessmentTopics. Do not invent facts not supported by the source.',
    input: curriculum.source_text
  });
  const analysis = response.output_text || '{}';
  const { rows } = await query('UPDATE curricula SET analysis=$1,status=\'analyzed\',updated_at=NOW() WHERE id=$2 RETURNING *',[analysis,curriculum.id]);
  return rows[0];
}
async function generateLesson({ tenantId, curriculumId, teacherId, title, sourceText }) {
  if (!client) throw new Error('OPENAI_API_KEY is required');
  const response = await client.responses.create({ model: process.env.OPENAI_MODEL || 'gpt-5.6-luna', instructions:'Create a teacher-reviewable lesson grounded only in the supplied curriculum. Return JSON with objectives, explanation, examples, misconceptions and quiz.', input:sourceText });
  const { rows } = await query('INSERT INTO lessons(tenant_id,curriculum_id,teacher_id,title,content,status) VALUES($1,$2,$3,$4,$5,\'pending_review\') RETURNING *',[tenantId,curriculumId,teacherId,title,response.output_text]);
  return rows[0];
}
async function reviewLesson({ tenantId, lessonId, teacherId, status }) {
  if (!['approved','rejected'].includes(status)) throw new Error('Invalid review status');
  const { rows } = await query('UPDATE lessons SET status=$1,reviewed_by=$2,updated_at=NOW() WHERE id=$3 AND tenant_id=$4 RETURNING *',[status,teacherId,lessonId,tenantId]);
  return rows[0];
}
module.exports={createCurriculum,analyzeCurriculum,generateLesson,reviewLesson};
