const test = require('node:test');
const assert = require('node:assert/strict');
const { registerRagScope } = require('../src/rag-scope');

function response() {
  return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
}

function setup(user = { id: 'teacher-1', tenant_id: 'tenant-1', role: 'teacher' }, rowsByCall = []) {
  let middleware;
  let handler;
  const app = { patch(_path, auth, fn) { middleware = auth; handler = fn; } };
  let index = 0;
  const query = async () => ({ rows: rowsByCall[index++] || [] });
  const getCurrentUser = async () => user;
  registerRagScope(app, { query, getCurrentUser });
  return {
    async invoke(req, res) {
      let error;
      await middleware(req, res, (nextError) => { error = nextError; });
      if (error) throw error;
      if (res.statusCode >= 400) return;
      await handler(req, res, (nextError) => { if (nextError) throw nextError; });
    }
  };
}

test('RAG scope rejects lesson without course', async () => {
  const route = setup();
  const res = response();
  await route.invoke({ params: { id: '11111111-1111-1111-1111-111111111111' }, body: { lessonId: '22222222-2222-2222-2222-222222222222' } }, res);
  assert.equal(res.statusCode, 400);
});

test('RAG scope rejects teacher-owned course mismatch', async () => {
  const route = setup({ id: 'teacher-1', tenant_id: 'tenant-1', role: 'teacher' }, [[]]);
  const res = response();
  await route.invoke({ params: { id: '11111111-1111-1111-1111-111111111111' }, body: { courseId: '22222222-2222-2222-2222-222222222222' } }, res);
  assert.equal(res.statusCode, 404);
});

test('RAG scope updates a document after ownership checks', async () => {
  const document = { id: '11111111-1111-1111-1111-111111111111', name: 'biology.pdf', course_id: '22222222-2222-2222-2222-222222222222', lesson_id: null };
  const route = setup({ id: 'teacher-1', tenant_id: 'tenant-1', role: 'teacher' }, [[{ id: document.course_id }], [document]]);
  const res = response();
  await route.invoke({ params: { id: document.id }, body: { courseId: document.course_id } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.document.course_id, document.course_id);
});
