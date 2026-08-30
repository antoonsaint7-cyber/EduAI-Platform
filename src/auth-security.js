'use strict';
const crypto = require('node:crypto');
const PASSWORD_MAX = 200;
const RESET_TTL_MS = 30 * 60 * 1000;

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 10 && password.length <= PASSWORD_MAX;
}
function hashToken(token) { return crypto.createHash('sha256').update(String(token)).digest('hex'); }
function createResetToken() {
  const token = crypto.randomBytes(32).toString('base64url');
  return { token, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) };
}
function createMfaSecret() { return crypto.randomBytes(20).toString('base32'); }
function constantTimeEqual(a, b) {
  const left = Buffer.from(String(a)); const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
module.exports = { PASSWORD_MAX, RESET_TTL_MS, validatePassword, hashToken, createResetToken, createMfaSecret, constantTimeEqual };
