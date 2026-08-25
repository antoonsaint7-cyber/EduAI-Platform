const { query } = require('./src/db');
const POLL_MS=Number(process.env.WORKER_POLL_MS||5000);
async function tick(){
  if(!process.env.DATABASE_URL) return;
  const {rows}=await query(`UPDATE jobs SET status='processing',attempts=attempts+1 WHERE id=(SELECT id FROM jobs WHERE status='queued' AND available_at<=NOW() ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`);
  const job=rows[0]; if(!job)return;
  try {
    // Job handlers are intentionally small and idempotent. Add domain-specific handlers here.
    if(!['curriculum.analyze','lesson.generate'].includes(job.type)) throw new Error(`Unknown job type: ${job.type}`);
    await query('UPDATE jobs SET status=\'completed\' WHERE id=$1',[job.id]);
  } catch(e) { await query('UPDATE jobs SET status=CASE WHEN attempts>=5 THEN \'failed\' ELSE \'queued\' END, available_at=NOW()+INTERVAL \'30 seconds\' WHERE id=$1',[job.id]); console.error(e); }
}
if(require.main===module){console.log('EduAI worker started');setInterval(()=>tick().catch(console.error),POLL_MS);tick().catch(console.error);}
module.exports={tick};
