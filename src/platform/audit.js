const crypto = require('node:crypto');
const { query } = require('./db');
async function audit({ action, actorId, actorRole, curriculumVersionId = null, metadata = {} }) {
  await query('INSERT INTO audit_events (id,action,actor_id,actor_role,curriculum_version_id,metadata) VALUES ($1,$2,$3,$4,$5,$6)', [crypto.randomUUID(), action, actorId || null, actorRole || null, curriculumVersionId, metadata]);
}
module.exports = { audit };
