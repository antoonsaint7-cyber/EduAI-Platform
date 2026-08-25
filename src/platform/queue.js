const crypto = require('node:crypto');
const { query } = require('./db');

async function enqueue(type, payload) {
  const id = crypto.randomUUID();
  await query('INSERT INTO jobs (id,type,status,payload) VALUES ($1,$2,$3,$4)', [id, type, 'queued', payload]);
  return id;
}
async function getJob(id) {
  const r = await query('SELECT * FROM jobs WHERE id=$1', [id]);
  return r.rows[0] || null;
}
async function claim(workerId) {
  const r = await query(`WITH candidate AS (
    SELECT id FROM jobs
    WHERE status='queued' AND available_at <= now()
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED LIMIT 1
  ) UPDATE jobs j SET status='processing', locked_at=now(), locked_by=$1, attempts=attempts+1, updated_at=now()
    FROM candidate WHERE j.id=candidate.id RETURNING j.*`, [workerId]);
  return r.rows[0] || null;
}
async function complete(id, result) { await query('UPDATE jobs SET status=$2,result=$3,updated_at=now() WHERE id=$1', [id, 'completed', result]); }
async function fail(id, error, retry = true) {
  if (retry) await query("UPDATE jobs SET status='queued', error=$2, available_at=now()+interval '30 seconds', updated_at=now() WHERE id=$1", [id, error]);
  else await query("UPDATE jobs SET status='failed', error=$2, updated_at=now() WHERE id=$1", [id, error]);
}
async function recoverStaleJobs() { await query("UPDATE jobs SET status='queued', locked_at=NULL, locked_by=NULL WHERE status='processing' AND locked_at < now()-interval '10 minutes'"); }
module.exports = { enqueue, getJob, claim, complete, fail, recoverStaleJobs };
