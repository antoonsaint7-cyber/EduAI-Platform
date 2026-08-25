const crypto=require('node:crypto');
const {query}=require('./db');
function token(){return crypto.randomBytes(32).toString('hex');}
function hash(value){return crypto.createHash('sha256').update(value).digest('hex');}
async function createSecurityToken({userId,purpose,ttlMs=30*60*1000}){const raw=token();await query('INSERT INTO email_tokens (id,user_id,purpose,token_hash,expires_at) VALUES ($1,$2,$3,$4,$5)',[crypto.randomUUID(),userId,purpose,hash(raw),new Date(Date.now()+ttlMs)]);return raw;}
async function consumeSecurityToken(raw,purpose){const r=await query('SELECT * FROM email_tokens WHERE token_hash=$1 AND purpose=$2 AND used_at IS NULL AND expires_at>now()',[hash(raw),purpose]);if(!r.rows[0])throw new Error('Invalid or expired token');await query('UPDATE email_tokens SET used_at=now() WHERE id=$1',[r.rows[0].id]);return r.rows[0];}
module.exports={createSecurityToken,consumeSecurityToken};
