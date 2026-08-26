export const PROCTOR_EVENT_TYPES = Object.freeze(['tab_hidden','fullscreen_exit','copy_attempt','paste_attempt','multiple_faces','identity_mismatch']);

export function recordProctorEvent(event = {}) {
  if (!PROCTOR_EVENT_TYPES.includes(event.type)) throw new Error('Unsupported proctor event');
  return { type: event.type, timestamp: event.timestamp ?? new Date().toISOString(), severity: event.severity ?? 'low', metadata: event.metadata ?? {} };
}

export function calculateIntegrityRisk(events = []) {
  const weights = { tab_hidden: 10, fullscreen_exit: 12, copy_attempt: 15, paste_attempt: 15, multiple_faces: 30, identity_mismatch: 40 };
  const score = Math.min(100, events.reduce((sum, event) => sum + (weights[event.type] || 0), 0));
  return { score, level: score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low' };
}
