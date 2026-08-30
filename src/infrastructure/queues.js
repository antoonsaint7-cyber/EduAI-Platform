const crypto = require('node:crypto');
const { Queue } = require('bullmq');
const { getRedis } = require('./redis');
const RAG_QUEUE = 'eduai-rag';
const ASSESSMENT_QUEUE = 'eduai-assessments';
const EMAIL_QUEUE = 'eduai-email';
function connection() { const redis = getRedis(); if (!redis) throw new Error('REDIS_URL is required for background queues'); return redis; }
const queues = new Map();
function getQueue(name) { if (!queues.has(name)) queues.set(name, new Queue(name, { connection: connection() })); return queues.get(name); }

function ragJobId(data) {
  const tenantId = String(data?.tenant_id || '').trim();
  const documentId = String(data?.document_id || '').trim();
  const checksum = String(data?.checksum || '').trim();
  if (!tenantId || !documentId || !checksum) return undefined;
  const identity = `${tenantId}:${documentId}:${checksum}`;
  return `rag-${crypto.createHash('sha256').update(identity).digest('hex')}`;
}

function enqueueRagJob(data, options = {}) {
  const jobOptions = {
    removeOnComplete: 100,
    removeOnFail: 500,
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    ...options,
  };
  if (!jobOptions.jobId) jobOptions.jobId = ragJobId(data);
  return getQueue(RAG_QUEUE).add('ingest-document', data, jobOptions);
}
function enqueueAssessmentJob(data, options = {}) { return getQueue(ASSESSMENT_QUEUE).add('generate-assessment', data, { removeOnComplete: 100, removeOnFail: 500, attempts: 3, backoff: { type: 'exponential', delay: 1000 }, ...options }); }
function enqueueEmailJob(data, options = {}) { return getQueue(EMAIL_QUEUE).add('send-email', data, { removeOnComplete: 100, removeOnFail: 500, attempts: 5, backoff: { type: 'exponential', delay: 2000 }, ...options }); }
module.exports = { RAG_QUEUE, ASSESSMENT_QUEUE, EMAIL_QUEUE, getQueue, ragJobId, enqueueRagJob, enqueueAssessmentJob, enqueueEmailJob };
