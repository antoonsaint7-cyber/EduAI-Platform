'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { hashToken, generateTotpSecret, verifyTotp } = require('../src/auth-hardening');

test('auth token hashing is deterministic and does not expose the token', () => {
  const token = crypto.randomBytes(32).toString('base64url');
  const hash = hashToken(token);
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.notEqual(hash, token);
  assert.equal(hashToken(token), hash);
});

test('TOTP secret generates valid six-digit codes with clock skew tolerance', () => {
  const secret = generateTotpSecret();
  const now = Date.now();
  const counter = Math.floor(now / 1000 / 30);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = [];
  let bits = 0;
  let value = 0;
  for (const ch of secret) {
    value = (value << 5) | alphabet.indexOf(ch);
    bits += 5;
    if (bits >= 8) { bits -= 8; bytes.push((value >> bits) & 255); }
  }
  const key = Buffer.from(bytes);
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac('sha1', key).update(msg).digest();
  const offset = digest[digest.length - 1] & 15;
  const code = String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
  assert.equal(code.length, 6);
  assert.equal(verifyTotp(secret, code, now), true);
  assert.equal(verifyTotp(secret, code, now + 30_000), true);
  assert.equal(verifyTotp(secret, '000000', now), false);
});
