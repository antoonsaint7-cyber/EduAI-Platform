'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { registerRagTutor } = require('../src/rag-tutor');

function response() {
  return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
}

function setup({ user = { id: 'student-1', tenant_id: 'tenant-1', role: 'student' }, queryImpl = async () => ({ rows: [] }), client = null } = {}) {
  let auth;
  let handler;
  const app = { post(_path, authMiddleware, fn) { auth = authMiddleware; handler = fn; } };
  const getCurrentUser = async () => user;
  registerRagTutor(app, { query: queryImpl, getCurrentUser, client });
  return async (req, res) => auth(req, res, error => { if (error) throw error; return handler(req, res, error2 => { if (error2) throw error2; }); });
}

test('grounded tutor rejects unauthenticated requests', async () => {
  const handler = setup({ user: null });
  const res = response();
  await handler({ body: { message: 'What is this?' } }, res);
  assert.equal(res.statusCode, 401);
});

test('grounded tutor rejects missing question', async () => {
  const handler = setup();
  const res = response();
  await handler({ body: {} }, res);
  assert.equal(res.statusCode, 400);
});

test('student cannot use an unpublished lesson', async () => {
  const handler = setup({ queryImpl: async sql => sql.includes('FROM lessons') ? { rows: [{ id: '12345678-1234-1234-1234-123456789012', title: 'Draft', status: 'draft', course_id: null }] } : { rows: [] } });
  const res = response();
  await handler({ body: { message: 'Explain it', lessonId: '12345678-1234-1234-1234-123456789012' } }, res);
  assert.equal(res.statusCode, 403);
});

test('student cannot access a course lesson without membership', async () => {
  const handler = setup({ queryImpl: async sql => {
    if (sql.includes('FROM lessons')) return { rows: [{ id: '12345678-1234-1234-1234-123456789012', title: 'Algebra', status: 'published', course_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', course_status: 'published' }] };
    if (sql.includes('FROM course_memberships')) return { rows: [] };
    return { rows: [] };
  } });
  const res = response();
  await handler({ body: { message: 'Explain it', lessonId: '12345678-1234-1234-1234-123456789012', courseId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' } }, res);
  assert.equal(res.statusCode, 403);
});

test('student course access requires an active or completed membership', async () => {
  const handler = setup({ queryImpl: async sql => {
    if (sql.includes('FROM courses')) return { rows: [{ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', title: 'Math', status: 'published' }] };
    if (sql.includes('FROM course_memberships')) return { rows: [] };
    return { rows: [] };
  } });
  const res = response();
  await handler({ body: { message: 'Explain it', courseId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' } }, res);
  assert.equal(res.statusCode, 403);
});

test('grounded tutor returns only tenant-scoped and lesson-scoped sources', async () => {
  const calls = [];
  const handler = setup({ user: { id: 'teacher-1', tenant_id: 'tenant-1', role: 'teacher' }, queryImpl: async (sql, params) => {
    calls.push({ sql, params });
    if (sql.includes('FROM lessons')) return { rows: [{ id: '12345678-1234-1234-1234-123456789012', title: 'Fractions', subject: 'Math', level: '5', content: 'Fractions are parts of a whole.', status: 'published', course_id: null, course_status: null }] };
    if (sql.includes('FROM document_chunks')) return { rows: [{ id: 'chunk-1', document_id: 'doc-1', chunk_index: 0, content: 'A fraction represents part of a whole.', name: 'Math notes', course_id: null, lesson_id: null }] };
    return { rows: [] };
  } });
  const res = response();
  await handler({ body: { message: 'What is a fraction?', lessonId: '12345678-1234-1234-1234-123456789012' } }, res);
  assert.equal(res.statusCode, 503);
  assert.ok(res.body.citations.length >= 1);
  const documentCall = calls.find(call => call.sql.includes('FROM document_chunks'));
  assert.match(documentCall.sql, /dc\.tenant_id=\$1/);
  assert.match(documentCall.sql, /d\.lesson_id=\$2 OR d\.lesson_id IS NULL/);
});

test('grounded tutor calls the AI client with source-grounded prompt', async () => {
  let request;
  const client = { chat: { completions: { create: async value => { request = value; return { choices: [{ message: { content: 'Fractions are parts of a whole. [1]' } }] }; } } } };
  const handler = setup({ user: { id: 'teacher-1', tenant_id: 'tenant-1', role: 'teacher' }, queryImpl: async sql => sql.includes('FROM lessons') ? { rows: [{ id: '12345678-1234-1234-1234-123456789012', title: 'Fractions', subject: 'Math', level: '5', content: 'Fractions are parts of a whole.', status: 'published', course_id: null, course_status: null }] } : { rows: [] }, client });
  const res = response();
  await handler({ body: { message: 'What are fractions?', lessonId: '12345678-1234-1234-1234-123456789012' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.sources_used, 1);
  assert.match(request.messages[1].content, /Answer the educational question using only the supplied sources/);
  assert.match(request.messages[1].content, /Fractions are parts of a whole/);
});
