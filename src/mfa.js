const crypto = require('crypto');
const { query } = require('./db');

function base32Decode(input) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = ''; const clean = input.replace(/=+$/,'').toUpperCase();
  for (const c of clean) { const n = alphabet.indexOf(c); if (n < 0) throw new Error('Invalid TOTP secret'); bits += n.toString(2).padStart(5,'0'); }
  const out=[]; for(let i=0;i+8<=bits.length;i+=8) out.push(parseInt(bits.slice(i,i+8),2)); return Buffer.from(out);
}
function totp(secret, counter) {
  const key = base32Decode(secret); const buf=Buffer.alloc(8); buf.writeBigUInt64BE(BigInt(counter));
  const h=crypto.createHmac('sha1',key).update(buf).digest(); const offset=h[19]&15; const code=((h.readUInt32BE(offset)&0x7fffffff)%1000000).toString().padStart(6,'0'); return code;
}
function verifyTotp(secret, token) { const now=Math.floor(Date.now()/1000/30); return [-1,0,1].some(i=>totp(secret,now+i)===String(token)); }
function randomBase32() { const bytes=crypto.randomBytes(20); const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits=''; for(const b of bytes) bits+=b.toString(2).padStart(8,'0'); let out=''; for(let i=0;i+5<=bits.length;i+=5) out+=alphabet[parseInt(bits.slice(i,i+5),2)]; return out; }

async function enrollMfa(userId) {
  const secret = randomBase32(); await query('UPDATE users SET mfa_secret=$1 WHERE id=$2', [secret,userId]); return secret;
}
async function verifyMfa(userId, code) { const {rows}=await query('SELECT mfa_secret FROM users WHERE id=$1',[userId]); return !!rows[0]?.mfa_secret && verifyTotp(rows[0].mfa_secret,code); }
module.exports={enrollMfa,verifyMfa,verifyTotp};
