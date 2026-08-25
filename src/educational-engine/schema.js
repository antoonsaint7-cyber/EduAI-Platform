const curriculumSchema = {
  id: 'curriculum-id', title: 'Curriculum title', grade: 'Grade', subject: 'Subject', sourceVersion: 'source-version',
  units: [{ id: 'unit-id', title: 'Unit title', lessons: [{ id: 'lesson-id', title: 'Lesson title', objectives: [], concepts: [], sourceRefs: [], generated: { summary: '', explanation: '', examples: [], questions: [] }, evaluation: { status: 'pending', grounded: false, issues: [] } }] }]
};

function validateCurriculum(value) {
  if (!value || typeof value !== 'object') return ['curriculum must be an object'];
  const errors = [];
  for (const key of ['id', 'title', 'grade', 'subject', 'sourceVersion']) if (typeof value[key] !== 'string' || !value[key].trim()) errors.push(`${key} is required`);
  if (!Array.isArray(value.units)) errors.push('units must be an array');
  return errors;
}

module.exports = { curriculumSchema, validateCurriculum };
