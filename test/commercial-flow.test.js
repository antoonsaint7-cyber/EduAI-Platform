'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('main dashboard wires the unified student and teacher flow', () => {
  const html = read('public/dashboard.html');
  assert.match(html, /dashboard-v2\.js/);
  assert.match(html, /tutor-context\.js/);
  assert.match(html, /assessment-center\.js/);
  assert.match(html, /commercial-flow\.js/);
  assert.match(html, /id="adaptiveLearning"/);
  assert.match(html, /id="studentLessons"/);
  assert.match(html, /id="studentAssessments"/);
  assert.match(html, /id="teacher"/);
});

test('commercial flow connects lessons, tutor context, recommendations, mastery and teacher analytics', () => {
  const script = read('public/commercial-flow.js');
  assert.match(script, /\/api\/lessons/);
  assert.match(script, /data-lesson-id/);
  assert.match(script, /eduai-tutor-context/);
  assert.match(script, /\/api\/learning\/next/);
  assert.match(script, /\/api\/learning\/mastery/);
  assert.match(script, /\/api\/analytics\/teacher\/student/);
  assert.match(script, /الصعوبة المقترحة/);
});

test('grounded tutor endpoint is present and protected by source scoping tests', () => {
  const tutor = read('src/rag-tutor.js');
  const tests = read('test/rag-tutor.test.js');
  assert.match(tutor, /\/api\/tutor\/grounded/);
  assert.match(tutor, /dc\.tenant_id=\$1/);
  assert.match(tests, /unauthenticated/);
  assert.match(tests, /membership/);
  assert.match(tests, /tenant-scoped and lesson-scoped/);
});
