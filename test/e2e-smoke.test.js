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

test('HTTP smoke flow reaches the real application health endpoint', async () => {
  const { server, base } = await startServer();
  try {
    const health = await request(base, '/health');
    assert.equal(health.response.status, 200);
    assert.equal(health.body.status, 'ok');
  } finally {
    await new Promise(resolve => server.close(resolve));
    await closeDb();
  }
});
