const crypto = require('node:crypto');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(input) {
  const clean = String(input).replace(/=+$/,'').toUpperCase().replace(/[^A-Z2-7]/g,'');
  let bits = 0; let value = 0; const bytes = [];
  for (const ch of clean) {
    value = (value << 5) | BASE32_ALPHABET.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function hotp(secret, counter) {
  const msg=Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(counter));
  const h=crypto.createHmac('sha1',base32Decode(secret)).update(msg).digest();
  const offset=h[h.length-1]&15;
  const code=((h.readUInt32BE(offset)&0x7fffffff)%1000000).toString().padStart(6,'0');
  return code;
}

function verifyTotp(secret, token, step=30, window=1, now=Date.now()) {
  const counter=Math.floor(now/1000/step);
  return Array.from({length:window*2+1},(_,i)=>counter+i-window).some(c=>hotp(secret,c)===String(token));
}

function newSecret(){ return base32Encode(crypto.randomBytes(20)); }

module.exports={verifyTotp,newSecret};
