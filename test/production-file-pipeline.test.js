'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {
  buildPrivateObjectKey,
  runProductionFilePipeline,
} = require('../src/infrastructure/production-file-pipeline');

async function tempFile(content) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'eduai-pipeline-'));
  const filePath = path.join(dir, 'lesson.pdf');
  await fs.writeFile(filePath, content);
  return { dir, filePath };
}

test('production file pipeline scans before private storage, extraction and RAG enqueue', async () => {
  const { dir, filePath } = await tempFile('safe lesson content');
  const events = [];
  try {
    const result = await runProductionFilePipeline({
      tenantId: 'school-a',
      documentId: 'doc-1',
      filename: 'lesson.pdf',
      mimeType: 'application/pdf',
      size: 19,
      localPath: filePath,
      scanner: { scan: async () => { events.push('scan'); return { clean: true, scanner: 'clamav' }; } },
      objectStorage: {
        putPrivateObject: async ({ objectKey }) => {
          events.push('storage');
          return { private: true, objectKey, etag: 'etag-1' };
        },
      },
      extract: async () => { events.push('extract'); return { text: 'Physics lesson', metadata: { title: 'Physics' }, pages: 1 }; },
      enqueue: async (data, options) => {
        events.push('enqueue');
        return { id: options.jobId, data };
      },
    });

    assert.deepEqual(events, ['scan', 'storage', 'extract', 'enqueue']);
    assert.equal(result.queued, true);
    assert.equal(result.object_key.startsWith('tenants/school-a/documents/doc-1/'), true);
    assert.equal(result.job.id, result.job_id);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('production file pipeline fails closed when malware scanner is unavailable or uncertain', async () => {
  const { dir, filePath } = await tempFile('untrusted');
  try {
    await assert.rejects(
      () => runProductionFilePipeline({
        tenantId: 'school-a', documentId: 'doc-2', filename: 'lesson.pdf',
        mimeType: 'application/pdf', size: 9, localPath: filePath,
        scanner: { scan: async () => ({}) },
        objectStorage: { putPrivateObject: async () => { throw new Error('storage must not run'); } },
      }),
      /no clean verdict/
    );
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('infected uploads never reach object storage', async () => {
  const { dir, filePath } = await tempFile('infected');
  try {
    let storageCalled = false;
    await assert.rejects(
      () => runProductionFilePipeline({
        tenantId: 'school-a', documentId: 'doc-3', filename: 'lesson.pdf',
        mimeType: 'application/pdf', size: 8, localPath: filePath,
        scanner: { scan: async () => ({ clean: false, scanner: 'clamav', response: 'stream: Eicar-Test-Signature FOUND' }) },
        objectStorage: { putPrivateObject: async () => { storageCalled = true; } },
      }),
      /rejected by malware scanner/
    );
    assert.equal(storageCalled, false);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('object keys are tenant/document/checksum scoped', () => {
  const key = buildPrivateObjectKey({
    tenantId: 'school-a', documentId: 'doc-4',
    checksum: 'a'.repeat(64), filename: '../../lesson final.pdf',
  });
  assert.equal(key, `tenants/school-a/documents/doc-4/${'a'.repeat(64)}/lesson_final.pdf`);
});
