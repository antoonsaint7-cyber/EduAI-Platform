import { Worker } from 'bullmq';
import { getRedis } from './redis.js';
import { RAG_QUEUE } from './queues.js';

export function createRagWorker(processDocument) {
  const redis = getRedis();
  if (!redis) throw new Error('REDIS_URL is required to start the RAG worker');
  return new Worker(RAG_QUEUE, async (job) => processDocument(job.data, job), { connection: redis, concurrency: Number(process.env.RAG_WORKER_CONCURRENCY || 2) });
}

if (process.env.RUN_RAG_WORKER === 'true') {
  createRagWorker(async (data) => {
    if (typeof globalThis.processRagDocument !== 'function') throw new Error('RAG processor is not configured');
    return globalThis.processRagDocument(data);
  });
  console.log(`EduAI RAG worker started with concurrency=${process.env.RAG_WORKER_CONCURRENCY || 2}`);
}
