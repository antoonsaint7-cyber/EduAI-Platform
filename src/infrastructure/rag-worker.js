const { Worker } = require('bullmq');
const { getRedis, closeRedis } = require('./redis');
const { RAG_QUEUE } = require('./queues');
const { processDocument: productionProcessor } = require('./rag-processor');

function createRagWorker(processDocument = productionProcessor) {
  if (typeof processDocument !== 'function') throw new TypeError('processDocument must be a function');
  const redis = getRedis();
  if (!redis) throw new Error('REDIS_URL is required to start the RAG worker');
  return new Worker(RAG_QUEUE, async (job) => processDocument(job.data, job), {
    connection: redis,
    concurrency: Math.max(1, Number(process.env.RAG_WORKER_CONCURRENCY) || 2),
  });
}

module.exports = { createRagWorker };

if (require.main === module) {
  if (process.env.RUN_RAG_WORKER !== 'true') {
    throw new Error('RUN_RAG_WORKER=true is required to start the production RAG worker');
  }
  const worker = createRagWorker();
  worker.on('completed', (job) => console.log(`RAG job ${job.id} completed.`));
  worker.on('failed', (job, error) => console.error(`RAG job ${job?.id || 'unknown'} failed: ${error?.message || error}`));
  console.log(`EduAI RAG worker started with concurrency=${Math.max(1, Number(process.env.RAG_WORKER_CONCURRENCY) || 2)}`);

  let shuttingDown = false;
  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}; stopping RAG worker.`);
    await worker.close();
    await closeRedis();
    process.exit(0);
  }
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}
