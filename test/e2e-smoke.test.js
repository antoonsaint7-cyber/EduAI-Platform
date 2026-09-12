const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { app } = require('../server');
const { close: closeDb } = require('../src/db');

async function startServer() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

async function request(base, path, options = {}) {
  const response = await fetch(`${base}${path}`, options);
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { response, body };
}

test('HTTP E2E commercial demo flow: overview -> lesson -> tutor -> adaptive recommendation', async () => {
  const { server, base } = await startServer();
  try {
    const health = await request(base, '/health');
    assert.equal(health.response.status, 200);
    assert.equal(health.body.status, 'ok');

    const status = await request(base, '/api/demo/status');
    assert.equal(status.response.status, 200);
    assert.equal(status.body.enabled, true);
    assert.equal(status.body.ai_cost, 0);

    const overview = await request(base, '/api/demo/overview');
    assert.equal(overview.response.status, 200);
    assert.equal(overview.body.demo, true);
    assert.equal(overview.body.course.status, 'published');
    assert.equal(overview.body.course.lessons.length, 3);
    assert.equal(overview.body.progress.recentAssessment.score, 78);
    assert.equal(overview.body.next.topic, 'Fractions');
    assert.equal(overview.body.next.mastery, 62);

    const lesson = overview.body.course.lessons.find(item => item.id === 'demo-lesson-fractions');
    assert.ok(lesson);
    assert.match(lesson.content, /numerator/i);

    const tutor = await request(base, '/api/demo/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'What is a fraction?' }),
    });
    assert.equal(tutor.response.status, 200);
    assert.equal(tutor.body.demo, true);
    assert.match(tutor.body.answer, /numerator/i);
    assert.equal(tutor.body.sources[0].lessonId, lesson.id);

    const dashboard = await request(base, '/dashboard.html');
    assert.equal(dashboard.response.status, 200);
    assert.match(String(dashboard.body), /commercial-flow\.js/);
    assert.match(String(dashboard.body), /tutor-context\.js/);
    assert.match(String(dashboard.body), /assessment-center\.js/);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await closeDb();
  }
});

test('health endpoint is reachable', async () => {
  const { server, base } = await startServer();
  try {
    const { response, body } = await request(base, '/health');
    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
  } finally {
    await new Promise(resolve => server.close(resolve));
    await closeDb();
  }
});
