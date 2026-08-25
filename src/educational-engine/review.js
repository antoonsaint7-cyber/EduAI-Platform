import { getVersion, setEvaluation, approveVersion, listVersions } from './store.js';

export function evaluateAndQueue(versionId, evaluation) {
  return setEvaluation(versionId, evaluation);
}

export function reviewQueue() {
  return listVersions().filter((version) => version.status === 'awaiting-review' || version.status === 'needs-review');
}

export function publishApproved(versionId, reviewer) {
  return approveVersion(versionId, reviewer);
}

export function getReviewableVersion(versionId) {
  const version = getVersion(versionId);
  if (!version) throw new Error('Curriculum version not found');
  return version;
}
