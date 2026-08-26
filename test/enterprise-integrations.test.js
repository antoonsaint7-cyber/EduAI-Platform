const test = require('node:test');
const assert = require('node:assert/strict');
const { getQuota, consumeTokens, validateCustomDomain } = require('../src/enterprise/saas-controls');
const { hasPermission } = require('../src/enterprise/rbac');
const { assertTenantAccess, resolveTenantFromHost } = require('../src/enterprise/tenant-resolution');
const { validateBulkRows } = require('../src/integrations/bulk-data');
const { mapLtiRole } = require('../src/integrations/lti13');
const { normalizeScormScore } = require('../src/integrations/scorm');
const { createPaymentAdapter } = require('../src/integrations/payments');
const { createLmsAdapter } = require('../src/integrations/lms-adapters');
const { calculateGamificationState } = require('../src/engagement/gamification');
const { calculateIntegrityRisk } = require('../src/integrity/proctoring');
const { normalizeTranscript } = require('../src/voice/voice-tutor');

test('enterprise controls enforce quotas, RBAC and tenant isolation', () => {
  assert.equal(getQuota('School').monthlyTokens, 5000000);
  assert.equal(consumeTokens(90, 20, 100).allowed, false);
  assert.equal(hasPermission('Teacher', 'courses:manage'), true);
  assert.equal(hasPermission('Student', 'users:manage'), false);
  assert.equal(resolveTenantFromHost('School.Example.com:443', { 'school.example.com': 't1' }), 't1');
  assert.throws(() => assertTenantAccess('t1', 't2'), /denied/);
  assert.equal(validateCustomDomain('school.example.com'), 'school.example.com');
});

test('integration contracts validate inputs', () => {
  assert.deepEqual(validateBulkRows([{ name: 'Student', email: ' STUDENT@Example.com ' }])[0], { name: 'Student', email: 'student@example.com', externalId: null });
  assert.equal(mapLtiRole('Instructor'), 'Teacher');
  assert.equal(normalizeScormScore(120), 100);
  assert.equal(createPaymentAdapter('stripe', { apiKey: 'test' }).configured, true);
  assert.equal((await createLmsAdapter('moodle', { baseUrl: 'https://moodle.test', clientId: 'id' }).healthCheck()).configured, true);
});

test('engagement, integrity and voice foundations behave deterministically', () => {
  assert.equal(calculateGamificationState({ xp: 100, quizzesCompleted: 1 }).level, 2);
  assert.equal(calculateIntegrityRisk([{ type: 'identity_mismatch' }]).level, 'medium');
  assert.equal(normalizeTranscript('  hello   world  '), 'hello world');
});
