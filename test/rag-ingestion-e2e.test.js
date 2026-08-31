'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ingestDocument } = require('../src/infrastructure/document-ingestion');
const { createRagWorker } = require('../src/infrastructure/rag-worker');
const { RAG_QUEUE, getQueue } = require('../src/infrastructure/queues');
const { closeRedis } = require('../src/infrastructure/redis');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('document ingestion enqueues a job that is consumed by the RAG worker', { skip: !process.env.REDIS_URL }, async () => {
  const documentId = `e2e-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const checksum = `sha-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const processed = [];
  let worker;
  let queue;

  try {
    queue = getQueue(RAG_QUEUE);
    worker = createRagWorker(async (data) => {
      processed.push(data);
      return { document_id: data.document_id, chunks: 1 };
    });

    const result = await ingestDocument({
      tenantId: 'e2e-school',
      documentId,
      filename: 'lesson.pdf',
      mimeType: 'application/pdf',
      localPath: '/tmp/lesson.pdf',
      objectKey: `e2e-school/${documentId}/lesson.pdf`,
      checksum,
      extract: async () => ({
        text: 'Physics lesson: force equals mass multiplied by acceleration.',
        pages: 1,
        metadata: { title: 'Physics' },
      }),
    });

    assert.equal(result.queued, true);
    assert.equal(result.job_id, result.job.id);

    const deadline = Date.now() + 15000;
    let state = 'unknown';
    while (Date.now() < deadline) {
      const job = await queue.getJob(result.job_id);
      state = job ? await job.getState() : 'missing';
      if (state === 'completed' || state === 'failed') break;
      await sleep(100);
    }

    assert.equal(state, 'completed');
    assert.equal(processed.length, 1);
    assert.equal(processed[0].tenant_id, 'e2e-school');
    assert.equal(processed[0].document_id, documentId);
    assert.equal(processed[0].checksum, checksum);
    assert.match(processed[0].text, /force equals mass/);
  } finally {
    if (worker) await worker.close();
    if (queue) await queue.close();
    await closeRedis();
  }
});
