const crypto = require('node:crypto');

function base32Decode(input) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = String(input).replace(/=+$/,'').toUpperCase().replace(/[^A-Z2-7]/g,'');
  let bits = ''; for (const ch of clean) bits += alphabet.indexOf(ch).toString(2).padStart(5,'0');
  const bytes=[]; for(let i=0;i+8<=bits.length;i+=8) bytes.push(parseInt(bits.slice(i,i+8),2));
  return Buffer.from(bytes);
}
function hotp(secret, counter) {
  const msg=Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(counter));
  const h=crypto.createHmac('sha1',base32Decode(secret)).update(msg).digest();
  const offset=h[h.length-1]&15; const code=((h.readUInt32BE(offset)&0x7fffffff)%1000000).toString().padStart(6,'0');
  return code;
}
function verifyTotp(secret, token, step=30, window=1, now=Date.now()) {
  const counter=Math.floor(now/1000/step);
  return Array.from({length:window*2+1},(_,i)=>counter+i-window).some(c=>hotp(secret,c)===String(token));
}
function newSecret(){return crypto.randomBytes(20).toString('base64').replace(/\+/g,'').replace(/\//g,'').replace(/=/g,'').slice(0,32);}
module.exports={verifyTotp,newSecret};
