const test = require('node:test');
const assert = require('node:assert/strict');
const { registerRagTutor } = require('../src/rag-tutor');

function setup({ client = null, rows = [] } = {}) {
  let handler;
  const app = { post(_path, _auth, fn) { handler = fn; } };
  const query = async () => ({ rows });
  const getCurrentUser = async () => ({ id: 'student-1', tenant_id: 'tenant-1', role: 'student' });
  registerRagTutor(app, { query, getCurrentUser, client });
  return handler;
}

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
}

test('grounded tutor rejects missing question', async () => {
  const handler = setup();
  const res = response();
  await handler({ body: {} }, res, assert.fail);
  assert.equal(res.statusCode, 400);
});

test('grounded tutor returns a safe no-source response', async () => {
  const handler = setup({ rows: [] });
  const res = response();
  await handler({ body: { message: 'ما هو الكسوف؟' }, }, res, assert.fail);
  assert.equal(res.statusCode, 422);
  assert.deepEqual(res.body.citations, []);
});

test('grounded tutor uses retrieved lesson/document context and reports missing AI configuration', async () => {
  const handler = setup({ rows: [{ id: 'chunk-1', document_id: 'doc-1', chunk_index: 0, content: 'الكسوف يحدث عندما يحجب القمر ضوء الشمس عن جزء من الأرض.', name: 'Astronomy.pdf' }] });
  const res = response();
  await handler({ body: { message: 'متى يحدث الكسوف؟', referenceText: 'الكسوف يحدث عندما يحجب القمر ضوء الشمس عن جزء من الأرض.', referenceTitle: 'درس الفلك' } }, res, assert.fail);
  assert.equal(res.statusCode, 503);
  assert.ok(res.body.citations.length >= 1);
});

test('grounded tutor calls the OpenAI chat completion with grounded sources', async () => {
  let request;
  const client = { chat: { completions: { create: async value => { request = value; return { choices: [{ message: { content: 'يحدث الكسوف عندما يحجب القمر ضوء الشمس عن الأرض. [1]' } }] }; } } } };
  const handler = setup({ client, rows: [{ id: 'chunk-1', document_id: 'doc-1', chunk_index: 0, content: 'الكسوف يحدث عندما يحجب القمر ضوء الشمس عن جزء من الأرض.', name: 'Astronomy.pdf' }] });
  const res = response();
  await handler({ body: { message: 'متى يحدث الكسوف؟' } }, res, assert.fail);
  assert.equal(res.statusCode, 200);
  assert.match(request.messages[1].content, /Astronomy\.pdf/);
  assert.match(res.body.answer, /الكسوف/);
  assert.equal(res.body.sources_used, 1);
});
