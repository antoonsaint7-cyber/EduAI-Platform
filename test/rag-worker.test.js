const assert = require('node:assert/strict');
const test = require('node:test');
const { chunkText, createProductionProcessor } = require('../src/infrastructure/rag-processor');
const { createRagWorker } = require('../src/infrastructure/rag-worker');
const { closeRedis } = require('../src/infrastructure/redis');

test('production RAG processor chunks, embeds and persists documents', async () => {
  const queries = [];
  const embeddingsClient = {
    embeddings: {
      async create({ input }) {
        return { data: input.map((text, index) => ({ embedding: Array.from({ length: 1536 }, (_, dimension) => (index + 1) / (dimension + 1)) })) };
      },
    },
  };
  const processor = createProductionProcessor({
    embeddingsClient,
    dbQuery: async (sql, params) => {
      queries.push({ sql, params });
      return { rowCount: 1 };
    },
  });

  const text = 'A'.repeat(1300);
  const result = await processor({ tenant_id: 'tenant-1', document_id: 'doc-1', source_title: 'Physics', page: 3, text });
  assert.equal(result.document_id, 'doc-1');
  assert.equal(result.chunks, chunkText(text).length);
  assert.equal(queries.length, result.chunks);
  assert.match(queries[0].sql, /knowledge_chunks/);
  assert.match(queries[0].sql, /::vector/);
  assert.equal(queries[0].params[0], 'tenant-1');
  assert.equal(queries[0].params[1], 'doc-1');
  assert.match(queries[0].params[6], /^\[/);
});

test('production RAG processor rejects missing required job data', async () => {
  const processor = createProductionProcessor({
    embeddingsClient: { embeddings: { create: async () => ({ data: [] }) } },
    dbQuery: async () => ({ rowCount: 1 }),
  });
  await assert.rejects(() => processor({ document_id: 'doc-only' }), /tenant_id, document_id and text/);
});

test('RAG worker starts with the production processor and closes cleanly', async () => {
  assert.equal(typeof createRagWorker, 'function');
  assert.ok(process.env.REDIS_URL, 'REDIS_URL must be configured for the worker integration test');

  let worker;
  try {
    worker = createRagWorker();
    assert.equal(typeof worker.close, 'function');
  } finally {
    if (worker) await worker.close();
    await closeRedis();
  }
});
