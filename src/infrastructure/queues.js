import { Queue } from 'bullmq';
import { getRedis } from './redis.js';

export const RAG_QUEUE = 'eduai-rag';
export const ASSESSMENT_QUEUE = 'eduai-assessments';
export const EMAIL_QUEUE = 'eduai-email';

function connection() {
  const redis = getRedis();
  if (!redis) throw new Error('REDIS_URL is required for background queues');
  return redis;
}

const queues = new Map();
export function getQueue(name) {
  if (!queues.has(name)) queues.set(name, new Queue(name, { connection: connection() }));
  return queues.get(name);
}

export function enqueueRagJob(data, options = {}) {
  return getQueue(RAG_QUEUE).add('ingest-document', data, { removeOnComplete: 100, removeOnFail: 500, attempts: 3, backoff: { type: 'exponential', delay: 1000 }, ...options });
}

export function enqueueAssessmentJob(data, options = {}) {
  return getQueue(ASSESSMENT_QUEUE).add('generate-assessment', data, { removeOnComplete: 100, removeOnFail: 500, attempts: 3, ...options });
}

export function enqueueEmailJob(data, options = {}) {
  return getQueue(EMAIL_QUEUE).add('send-email', data, { removeOnComplete: 100, removeOnFail: 500, attempts: 5, backoff: { type: 'exponential', delay: 2000 }, ...options });
}
