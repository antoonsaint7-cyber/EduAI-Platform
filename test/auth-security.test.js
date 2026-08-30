'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const { validatePassword, hashToken, createResetToken, constantTimeEqual } = require('../src/auth-security');

test('password policy rejects weak or oversized passwords', () => {
  assert.equal(validatePassword('short'), false);
  assert.equal(validatePassword('1234567890'), true);
  assert.equal(validatePassword('x'.repeat(201)), false);
});

test('reset token is random, hashed and expires', () => {
  const item = createResetToken();
  assert.ok(item.token.length >= 32);
  assert.equal(item.tokenHash, hashToken(item.token));
  assert.ok(item.expiresAt.getTime() > Date.now());
});

test('constant-time comparison requires equal bytes', () => {
  assert.equal(constantTimeEqual('abc', 'abc'), true);
  assert.equal(constantTimeEqual('abc', 'abd'), false);
  assert.equal(constantTimeEqual('abc', 'ab'), false);
});
