const { query } = require('./db');
async function createEphemeralToken() {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required');
  const model = process.env.REALTIME_MODEL || 'gpt-realtime-2.1-mini';
  const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
    method:'POST', headers:{'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({session:{type:'realtime',model}})
  });
  if(!response.ok) throw new Error(`Realtime token request failed: ${response.status}`);
  return response.json();
}
async function recordUsage({tenantId,userId,kind,units}) { await query('INSERT INTO usage_events(tenant_id,user_id,kind,units) VALUES($1,$2,$3,$4)',[tenantId,userId,kind,units]); }
module.exports={createEphemeralToken,recordUsage};
