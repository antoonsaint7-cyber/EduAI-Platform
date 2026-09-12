const test = require('node:test');
const assert = require('node:assert/strict');
const { registerDemoMode, DEMO_LESSONS } = require('../src/demo-mode');

test('demo mode exposes deterministic zero-cost learning data', async () => {
  const routes = {};
  const app = {
    get(path, handler) { routes[`GET ${path}`] = handler; },
    post(path, handler) { routes[`POST ${path}`] = handler; },
  };
  registerDemoMode(app);

  assert.equal(DEMO_LESSONS.length, 3);
  assert.equal(routes['GET /api/demo/status'], Function.prototype);

  const statusResponse = { json(value) { this.value = value; } };
  routes['GET /api/demo/status']({}, statusResponse);
  assert.equal(statusResponse.value.provider, 'demo');
  assert.equal(statusResponse.value.ai_cost, 0);

  const chatResponse = { json(value) { this.value = value; }, status() { return this; } };
  await routes['POST /api/demo/chat']({ body: { message: 'What is a fraction?' } }, chatResponse);
  assert.equal(chatResponse.value.demo, true);
  assert.match(chatResponse.value.answer, /fraction/i);
  assert.equal(chatResponse.value.sources[0].lessonId, 'demo-lesson-fractions');
});
