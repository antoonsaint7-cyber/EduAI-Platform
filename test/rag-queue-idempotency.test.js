'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { ragJobId } = require('../src/infrastructure/queues');

test('RAG job identity is stable for the same tenant, document and checksum', () => {
  const data = { tenant_id: 'school-1', document_id: 'doc-7', checksum: 'abc123' };
  const expected = `rag-${crypto.createHash('sha256').update('school-1:doc-7:abc123').digest('hex')}`;
  assert.equal(ragJobId(data), expected);
  assert.equal(ragJobId({ ...data }), ragJobId(data));
});

test('RAG job identity changes when tenant, document or checksum changes', () => {
  const base = { tenant_id: 'school-1', document_id: 'doc-7', checksum: 'abc123' };
  assert.notEqual(ragJobId(base), ragJobId({ ...base, tenant_id: 'school-2' }));
  assert.notEqual(ragJobId(base), ragJobId({ ...base, document_id: 'doc-8' }));
  assert.notEqual(ragJobId(base), ragJobId({ ...base, checksum: 'def456' }));
});

test('RAG job identity is omitted when ingestion identity is incomplete', () => {
  assert.equal(ragJobId({}), undefined);
  assert.equal(ragJobId({ tenant_id: 'school-1', document_id: 'doc-7' }), undefined);
});
