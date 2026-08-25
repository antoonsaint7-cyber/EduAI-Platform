import crypto from 'node:crypto';

const curricula = new Map();

export function createVersion(curriculum, source = {}) {
  const id = crypto.randomUUID();
  const version = { id, curriculumId: curriculum.id, sourceVersion: curriculum.sourceVersion, createdAt: new Date().toISOString(), status: 'draft', source: { name: source.name || '', contentHash: source.contentHash || '' }, curriculum, evaluation: null, approvedBy: null, publishedAt: null };
  curricula.set(id, version);
  return version;
}

export function getVersion(id) { return curricula.get(id) || null; }
export function listVersions() { return [...curricula.values()]; }

export function setEvaluation(id, evaluation) {
  const version = getVersion(id);
  if (!version) throw new Error('Curriculum version not found');
  version.evaluation = evaluation;
  version.status = evaluation.status === 'passed' ? 'awaiting-review' : 'needs-review';
  return version;
}

export function approveVersion(id, reviewer = 'teacher') {
  const version = getVersion(id);
  if (!version) throw new Error('Curriculum version not found');
  if (version.evaluation?.status !== 'passed') throw new Error('Evaluation must pass before approval');
  version.status = 'published';
  version.approvedBy = reviewer;
  version.publishedAt = new Date().toISOString();
  return version;
}
