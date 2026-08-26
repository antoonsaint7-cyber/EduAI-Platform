export const SCORM_VERSIONS = Object.freeze(['1.2', '2004']);

export function buildScormManifest({ courseId, title, launchPath = '/launch' } = {}) {
  if (!courseId || !title) throw new Error('courseId and title are required');
  return {
    identifier: `eduai-${courseId}`,
    version: '1.0',
    title,
    schemaVersion: '1.2',
    launchPath,
    supportedVersions: [...SCORM_VERSIONS]
  };
}

export function normalizeScormScore(rawScore) {
  const value = Number(rawScore);
  if (!Number.isFinite(value)) throw new Error('invalid score');
  return Math.max(0, Math.min(100, value));
}
