export function auditEvent({ action, actorId, actorRole, curriculumVersionId, metadata = {} }) {
  return Object.freeze({
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    actorId: actorId || 'system',
    actorRole: actorRole || 'system',
    curriculumVersionId: curriculumVersionId || null,
    metadata,
    createdAt: new Date().toISOString()
  });
}
