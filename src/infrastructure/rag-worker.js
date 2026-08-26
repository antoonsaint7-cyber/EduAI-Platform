const { Worker } = require('bullmq');
const { getRedis } = require('./redis');
const { RAG_QUEUE } = require('./queues');

function createRagWorker(processDocument) {
  if (typeof processDocument !== 'function') throw new TypeError('processDocument must be a function');
  const redis = getRedis();
  if (!redis) throw new Error('REDIS_URL is required to start the RAG worker');
  return new Worker(RAG_QUEUE, async (job) => processDocument(job.data, job), { connection: redis, concurrency: Math.max(1, Number(process.env.RAG_WORKER_CONCURRENCY) || 2) });
}

module.exports = { createRagWorker };

if (require.main === module && process.env.RUN_RAG_WORKER === 'true') {
  const modulePath = process.env.RAG_PROCESSOR_MODULE;
  if (!modulePath) throw new Error('RAG_PROCESSOR_MODULE is required when RUN_RAG_WORKER=true');
  const processor = require(modulePath);
  if (typeof processor.processDocument !== 'function') throw new Error('RAG processor module must export processDocument');
  createRagWorker(processor.processDocument);
  console.log(`EduAI RAG worker started with concurrency=${Math.max(1, Number(process.env.RAG_WORKER_CONCURRENCY) || 2)}`);
}
