'use strict';
const crypto = require('node:crypto');

const PASSWORD_MAX = 200;
const RESET_TTL_MS = 30 * 60 * 1000;
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const MFA_CHALLENGE_TTL_MS = 5 * 60 * 1000;
const MFA_MAX_ATTEMPTS = 5;

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 10 && password.length <= PASSWORD_MAX;
}
function hashToken(token) { return crypto.createHash('sha256').update(String(token)).digest('hex'); }
function createToken(ttlMs) {
  const token = crypto.randomBytes(32).toString('base64url');
  return { token, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + ttlMs) };
}
function createResetToken() { return createToken(RESET_TTL_MS); }
function createVerificationToken() { return createToken(VERIFY_TTL_MS); }
function createMfaChallenge() { return createToken(MFA_CHALLENGE_TTL_MS); }
function base32Encode(buffer) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0; let value = 0; let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) { bits -= 5; output += alphabet[(value >>> bits) & 31]; }
  }
  if (bits) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}
function createMfaSecret() { return base32Encode(crypto.randomBytes(20)); }
function createRecoveryCodes(count = 10) {
  return Array.from({ length: count }, () => crypto.randomBytes(9).toString('base64url'));
}
function hashRecoveryCode(code) { return hashToken(String(code).trim().toLowerCase()); }
function base32Decode(input) {
  const normalized = String(input || '').toUpperCase().replace(/=+$/g, '').replace(/\s+/g, '');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0; let value = 0; const output = [];
  for (const char of normalized) {
    const index = alphabet.indexOf(char);
    if (index < 0) throw new Error('Invalid base32 secret.');
    value = (value << 5) | index; bits += 5;
    if (bits >= 8) { bits -= 8; output.push((value >>> bits) & 0xff); }
  }
  return Buffer.from(output);
}
function totp(secret, timestamp = Date.now()) {
  const counter = Math.floor(timestamp / 1000 / 30); const counterBuffer = Buffer.alloc(8); counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac('sha1', base32Decode(secret)).update(counterBuffer).digest(); const offset = digest[digest.length - 1] & 0x0f;
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, '0');
}
function verifyTotp(secret, code, timestamp = Date.now()) {
  const normalized = String(code || '').replace(/\s+/g, ''); if (!/^\d{6}$/.test(normalized)) return false;
  for (const delta of [-30, 0, 30]) if (constantTimeEqual(totp(secret, timestamp + delta * 1000), normalized)) return true;
  return false;
}
function constantTimeEqual(a, b) {
  const left = Buffer.from(String(a)); const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
module.exports = { PASSWORD_MAX, RESET_TTL_MS, VERIFY_TTL_MS, MFA_CHALLENGE_TTL_MS, MFA_MAX_ATTEMPTS, validatePassword, hashToken, createResetToken, createVerificationToken, createMfaChallenge, createMfaSecret, createRecoveryCodes, hashRecoveryCode, verifyTotp, constantTimeEqual };
