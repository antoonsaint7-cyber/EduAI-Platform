const test = require('node:test');
const assert = require('node:assert/strict');
const { buildEducationalPrompt } = require('../src/education');
const { hashPassword, verifyPassword, normalizeEmail } = require('../src/auth');

test('educational prompt keeps student behavior and source grounding', () => {
  const prompt = buildEducationalPrompt({ mode: 'student', subject: 'تاريخ', level: 'ثانوي', action: 'explain', text: 'نص الدرس' });
  assert.match(prompt, /طالب/);
  assert.match(prompt, /لا تخترع/);
  assert.match(prompt, /نص الدرس/);
});

test('teacher quiz prompt is deterministic', () => {
  const prompt = buildEducationalPrompt({ mode: 'teacher', action: 'quiz', text: 'الدرس' });
  assert.match(prompt, /10 أسئلة/);
  assert.match(prompt, /مدرس/);
});

test('password hashing is salted and verifiable', async () => {
  const password = 'Correct-Horse-Battery-42';
  const hash = await hashPassword(password);
  assert.notEqual(hash, password);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword('wrong-password', hash), false);
  assert.notEqual(hash, await hashPassword(password));
});

test('email normalization is stable', () => {
  assert.equal(normalizeEmail('  User@Example.COM '), 'user@example.com');
});
