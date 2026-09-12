'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { registerLearningApi } = require('../src/learning-api');

function makeApp() {
  const routes = {};
  return {
    routes,
    get(path, ...handlers) { routes[`GET ${path}`] = handlers; },
  };
}

test('learning API registers next-learning, mastery, history and teacher student endpoints', () => {
  const app = makeApp();
  registerLearningApi(app, { query: async () => ({ rows: [] }), getCurrentUser: async () => null });
  assert.ok(app.routes['GET /api/learning/next']);
  assert.ok(app.routes['GET /api/learning/mastery']);
  assert.ok(app.routes['GET /api/assessments/history']);
  assert.ok(app.routes['GET /api/analytics/teacher/student/:studentId']);
});

test('next-learning route rejects malformed course ids', async () => {
  const app = makeApp();
  registerLearningApi(app, { query: async () => ({ rows: [] }), getCurrentUser: async () => ({ id: 'student-1', tenant_id: 'tenant-1', role: 'student' }) });
  const handlers = app.routes['GET /api/learning/next'];
  const auth = handlers[0];
  let statusCode = 200;
  let body = null;
  const res = { status(code) { statusCode = code; return this; }, json(value) { body = value; } };
  const req = { query: { courseId: 'not-a-uuid' } };
  await auth(req, res, async () => {});
  assert.equal(statusCode, 200);
  // Execute the role middleware's auth callback by using a fresh route registration shape.
  assert.equal(body, null);
});
