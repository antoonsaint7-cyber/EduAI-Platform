'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const http = require('node:http');
const test = require('node:test');

process.env.AUTH_DEBUG_TOKENS = 'true';
process.env.NODE_ENV = 'test';

const { app } = require('../server');
const { query, close: closeDb } = require('../src/db');

function base32Decode(input) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0; let value = 0; const output = [];
  for (const char of String(input).replace(/=+$/g, '').toUpperCase()) {
    const index = alphabet.indexOf(char); if (index < 0) throw new Error('invalid base32');
    value = (value << 5) | index; bits += 5;
    if (bits >= 8) { bits -= 8; output.push((value >>> bits) & 255); }
  }
  return Buffer.from(output);
}
function totp(secret) {
  const counter = Math.floor(Date.now() / 30000); const input = Buffer.alloc(8); input.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac('sha1', base32Decode(secret)).update(input).digest(); const offset = digest[digest.length - 1] & 15;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
}
async function jsonRequest(base, path, body, cookie) {
  const response = await fetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
  const text = await response.text();
  return { response, body: text ? JSON.parse(text) : null };
}
function sessionCookie(response) { return response.headers.get('set-cookie')?.split(';')[0] || null; }

test('authentication hardening enforces verification, one-time reset, and two-stage MFA', { skip: !process.env.DATABASE_URL }, async () => {
  const server = http.createServer(app); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`; const email = `auth-${Date.now()}@example.test`; const password = 'correct-horse-battery-staple';
  let tenantId;
  try {
    const registered = await jsonRequest(base, '/api/auth/register', { name: 'Auth Test', email, password, role: 'student', tenantName: 'Auth Test School' });
    assert.equal(registered.response.status, 201); assert.equal(registered.body.verification_required, true); assert.equal(registered.response.headers.get('set-cookie'), null);
    const verificationToken = registered.response.headers.get('x-eduai-verification-token'); assert.ok(verificationToken);

    const blocked = await jsonRequest(base, '/api/auth/login', { email, password });
    assert.equal(blocked.response.status, 403); assert.equal(blocked.body.verification_required, true);

    const verified = await jsonRequest(base, '/api/auth/verify-email', { token: verificationToken });
    assert.equal(verified.response.status, 200); assert.equal(verified.body.verified, true);

    const loggedIn = await jsonRequest(base, '/api/auth/login', { email, password });
    assert.equal(loggedIn.response.status, 200); assert.equal(loggedIn.body.user.email, email); const cookie = sessionCookie(loggedIn.response); assert.ok(cookie);

    const setup = await jsonRequest(base, '/api/auth/mfa/setup', {}, cookie);
    assert.equal(setup.response.status, 200); assert.equal(setup.body.setup_required, true); assert.equal(setup.body.recovery_codes.length, 10); assert.ok(setup.body.secret);
    const recoveryCode = setup.body.recovery_codes[0];
    const confirm = await jsonRequest(base, '/api/auth/mfa/confirm', { code: totp(setup.body.secret) }, cookie);
    assert.equal(confirm.response.status, 200); assert.equal(confirm.body.enabled, true);

    await jsonRequest(base, '/api/auth/logout', {}, cookie);
    const mfaLogin = await jsonRequest(base, '/api/auth/login', { email, password });
    assert.equal(mfaLogin.response.status, 200); assert.equal(mfaLogin.body.mfa_required, true); assert.ok(mfaLogin.body.challenge_token); assert.equal(mfaLogin.response.headers.get('set-cookie'), null);

    const challenge = mfaLogin.body.challenge_token;
    const secondFactor = await jsonRequest(base, '/api/auth/mfa/verify-login', { challengeToken: challenge, code: totp(setup.body.secret) });
    assert.equal(secondFactor.response.status, 200); assert.equal(secondFactor.body.authenticated, true); const mfaCookie = sessionCookie(secondFactor.response); assert.ok(mfaCookie);

    const replay = await jsonRequest(base, '/api/auth/mfa/verify-login', { challengeToken: challenge, code: totp(setup.body.secret) });
    assert.equal(replay.response.status, 401);

    await jsonRequest(base, '/api/auth/logout', {}, mfaCookie);
    const recoveryLogin = await jsonRequest(base, '/api/auth/login', { email, password });
    const recoverySession = await jsonRequest(base, '/api/auth/mfa/verify-login', { challengeToken: recoveryLogin.body.challenge_token, code: recoveryCode });
    assert.equal(recoverySession.response.status, 200); assert.ok(sessionCookie(recoverySession.response));
    await jsonRequest(base, '/api/auth/logout', {}, sessionCookie(recoverySession.response));
    const recoveryReplayLogin = await jsonRequest(base, '/api/auth/login', { email, password });
    const recoveryReplay = await jsonRequest(base, '/api/auth/mfa/verify-login', { challengeToken: recoveryReplayLogin.body.challenge_token, code: recoveryCode });
    assert.equal(recoveryReplay.response.status, 401);

    const resetRequest = await jsonRequest(base, '/api/auth/password-reset/request', { email });
    assert.equal(resetRequest.response.status, 200); const resetToken = resetRequest.response.headers.get('x-eduai-reset-token'); assert.ok(resetToken);
    const reset = await jsonRequest(base, '/api/auth/password-reset/confirm', { token: resetToken, password: 'new-correct-password-123' });
    assert.equal(reset.response.status, 200); assert.equal(reset.body.reset, true);
    const reused = await jsonRequest(base, '/api/auth/password-reset/confirm', { token: resetToken, password: 'another-password-123' });
    assert.equal(reused.response.status, 400);
    assert.equal((await jsonRequest(base, '/api/auth/me', {}, mfaCookie)).response.status, 401);

    const row = await query('SELECT tenant_id FROM users WHERE email=$1 LIMIT 1', [email]); tenantId = row.rows[0]?.tenant_id;
  } finally {
    if (tenantId) await query('DELETE FROM tenants WHERE id=$1', [tenantId]);
    await new Promise(resolve => server.close(resolve)); await closeDb();
  }
});
