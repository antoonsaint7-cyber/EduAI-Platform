import { validateCurriculum } from './schema.js';

export function analyzeSource({ text, metadata = {} }) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Source text is required');
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const headings = lines.filter((line) => /^(unit|وحدة|lesson|درس|chapter|فصل)\b/i.test(line));
  const sections = headings.map((title, index) => ({ id: `section-${index + 1}`, title }));
  return { type: 'curriculum-analysis', metadata, textLength: text.length, sections, sourceHashInput: text };
}

export function generateDraft({ analysis, sourceText, subject = '', grade = '' }) {
  const sections = analysis.sections.length ? analysis.sections : [{ id: 'section-1', title: 'General lesson' }];
  const curriculum = {
    id: `curriculum-${Date.now()}`,
    title: analysis.metadata.title || 'Generated curriculum', grade, subject,
    sourceVersion: analysis.metadata.sourceVersion || 'uploaded-source',
    units: [{ id: 'unit-1', title: analysis.metadata.unitTitle || 'Unit 1', lessons: sections.map((section) => ({
      id: section.id, title: section.title, objectives: [], concepts: [],
      sourceRefs: [{ type: 'source', locator: section.id }],
      generated: { summary: sourceText.slice(0, 500), explanation: 'Draft generated from the supplied source.', examples: [], questions: [] },
      evaluation: { status: 'pending', grounded: false, issues: [] }
    })) }]
  };
  const errors = validateCurriculum(curriculum);
  if (errors.length) throw new Error(errors.join('; '));
  return curriculum;
}

export function evaluateDraft(curriculum, sourceText) {
  const issues = [];
  if (!sourceText?.trim()) issues.push('Missing source');
  if (!curriculum?.units?.length) issues.push('No units generated');
  for (const unit of curriculum?.units || []) for (const lesson of unit.lessons || []) {
    if (!lesson.sourceRefs?.length) issues.push(`${lesson.id}: missing source reference`);
    if (!lesson.generated?.summary) issues.push(`${lesson.id}: missing summary`);
  }
  return { status: issues.length ? 'needs-review' : 'passed', grounded: issues.length === 0, issues };
}

export function publishIfApproved(curriculum, evaluation, { approved = false } = {}) {
  if (!approved) return { status: 'pending-human-review', curriculum };
  if (evaluation.status !== 'passed') throw new Error('Curriculum must pass evaluation before publication');
  return { status: 'published', publishedAt: new Date().toISOString(), curriculum };
}
