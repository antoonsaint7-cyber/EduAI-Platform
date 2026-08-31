'use strict';

const crypto = require('node:crypto');
const { query } = require('./db');

const TOKEN_TTL = 30 * 60 * 1000;
const VERIFY_TTL = 24 * 60 * 60 * 1000;
const TOTP_STEP = 30;
const TOTP_DIGITS = 6;

function randomToken() { return crypto.randomBytes(32).toString('base64url'); }
function hashToken(token) { return crypto.createHash('sha256').update(String(token)).digest('hex'); }

async function issueAuthToken(userId, purpose, ttl = purpose === 'email_verification' ? VERIFY_TTL : TOKEN_TTL) {
  const token = randomToken();
  await query('DELETE FROM auth_tokens WHERE user_id=$1 AND purpose=$2 AND consumed_at IS NULL', [userId, purpose]);
  await query('INSERT INTO auth_tokens(user_id,token_hash,purpose,expires_at) VALUES($1,$2,$3,$4)', [userId, hashToken(token), purpose, new Date(Date.now() + ttl)]);
  return token;
}

async function consumeAuthToken(token, purpose) {
  const result = await query('UPDATE auth_tokens SET consumed_at=now() WHERE token_hash=$1 AND purpose=$2 AND consumed_at IS NULL AND expires_at > now() RETURNING user_id', [hashToken(token), purpose]);
  return result.rows[0]?.user_id || null;
}

function encryptionKey() {
  const raw = process.env.AUTH_MFA_ENCRYPTION_KEY;
  if (!raw) throw new Error('AUTH_MFA_ENCRYPTION_KEY is required for MFA.');
  return crypto.createHash('sha256').update(raw).digest();
}

function encryptSecret(secret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

function decryptSecret(payload) {
  const [ivText, tagText, dataText] = String(payload).split('.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivText, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(dataText, 'base64url')), decipher.final()]).toString('utf8');
}

function base32Decode(input) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = String(input).replace(/=+$/,'').toUpperCase().replace(/[^A-Z2-7]/g,'');
  let bits = 0, value = 0, out = [];
  for (const ch of clean) {
    value = (value << 5) | alphabet.indexOf(ch); bits += 5;
    if (bits >= 8) { bits -= 8; out.push((value >> bits) & 255); }
  }
  return Buffer.from(out);
}

function base32Encode(buffer) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0, value = 0, out = '';
  for (const byte of buffer) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { bits -= 5; out += alphabet[(value >> bits) & 31]; }
  }
  if (bits) out += alphabet[(value << (5 - bits)) & 31];
  return out;
}

function generateTotpSecret() { return base32Encode(crypto.randomBytes(20)); }

function totp(secret, counter) {
  const key = base32Decode(secret);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac('sha1', key).update(msg).digest();
  const offset = digest[digest.length - 1] & 15;
  const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(code).padStart(6, '0');
}

function verifyTotp(secret, code, now = Date.now()) {
  const supplied = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(supplied)) return false;
  const counter = Math.floor(now / 1000 / TOTP_STEP);
  for (const delta of [-1, 0, 1]) {
    const expected = totp(secret, counter + delta);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) return true;
  }
  return false;
}

function recoveryCode() { return crypto.randomBytes(6).toString('hex').toUpperCase(); }

async function createMfaEnrollment(userId) {
  const secret = generateTotpSecret();
  await query('INSERT INTO user_mfa(user_id,secret_encrypted) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET secret_encrypted=EXCLUDED.secret_encrypted, enabled_at=NULL, updated_at=now()', [userId, encryptSecret(secret)]);
  return { secret, issuer: process.env.MFA_ISSUER || 'EduAI Platform' };
}

async function enableMfa(userId, code) {
  const result = await query('SELECT secret_encrypted FROM user_mfa WHERE user_id=$1', [userId]);
  if (!result.rows[0] || !verifyTotp(decryptSecret(result.rows[0].secret_encrypted), code)) return false;
  await query('UPDATE user_mfa SET enabled_at=now(), updated_at=now() WHERE user_id=$1', [userId]);
  await query('DELETE FROM mfa_recovery_codes WHERE user_id=$1', [userId]);
  const codes = Array.from({ length: 8 }, recoveryCode);
  for (const codeValue of codes) await query('INSERT INTO mfa_recovery_codes(user_id,code_hash) VALUES($1,$2)', [userId, hashToken(codeValue)]);
  return codes;
}

async function verifyMfa(userId, code) {
  const result = await query('SELECT secret_encrypted, enabled_at FROM user_mfa WHERE user_id=$1', [userId]);
  if (!result.rows[0]?.enabled_at) return false;
  return verifyTotp(decryptSecret(result.rows[0].secret_encrypted), code);
}

async function consumeRecoveryCode(userId, code) {
  const result = await query('UPDATE mfa_recovery_codes SET used_at=now() WHERE user_id=$1 AND code_hash=$2 AND used_at IS NULL RETURNING id', [userId, hashToken(String(code).trim().toUpperCase())]);
  return Boolean(result.rows[0]);
}

module.exports = { issueAuthToken, consumeAuthToken, hashToken, createMfaEnrollment, enableMfa, verifyMfa, consumeRecoveryCode, decryptSecret, generateTotpSecret, verifyTotp };
