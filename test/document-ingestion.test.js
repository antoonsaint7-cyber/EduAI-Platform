'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDocumentJobId, ingestDocument } = require('../src/infrastructure/document-ingestion');

test('document ingestion extracts content and enqueues a tenant-safe idempotent RAG job', async () => {
  const calls = [];
  const result = await ingestDocument({
    tenantId: 'school-a',
    documentId: 'doc-7',
    filename: 'lesson.pdf',
    mimeType: 'application/pdf',
    localPath: '/tmp/lesson.pdf',
    objectKey: 'school-a/doc-7/lesson.pdf',
    checksum: 'abc123',
    extract: async (input) => {
      calls.push(['extract', input]);
      return { text: 'Lesson content', pages: 2, metadata: { title: 'Lesson' } };
    },
    enqueue: async (data, options) => {
      calls.push(['enqueue', data, options]);
      return { id: options.jobId };
    },
  });

  assert.equal(calls[0][0], 'extract');
  assert.equal(calls[1][0], 'enqueue');
  assert.equal(calls[1][1].tenant_id, 'school-a');
  assert.equal(calls[1][1].document_id, 'doc-7');
  assert.equal(calls[1][1].text, 'Lesson content');
  assert.equal(calls[1][1].metadata.title, 'Lesson');
  assert.equal(calls[1][2].jobId, buildDocumentJobId({ tenantId: 'school-a', documentId: 'doc-7', checksum: 'abc123' }));
  assert.equal(result.queued, true);
});

test('document ingestion refuses missing checksum before extraction', async () => {
  await assert.rejects(
    () => ingestDocument({ tenantId: 'school-a', documentId: 'doc-7', localPath: '/tmp/x.pdf' }),
    /checksum are required/
  );
});

test('document ingestion refuses empty extracted content', async () => {
  await assert.rejects(
    () => ingestDocument({
      tenantId: 'school-a', documentId: 'doc-7', localPath: '/tmp/x.pdf', checksum: 'abc',
      extract: async () => ({ text: '   ' }),
      enqueue: async () => { throw new Error('enqueue must not run'); },
    }),
    /produced no text/
  );
});
