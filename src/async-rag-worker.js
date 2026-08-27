const { EventEmitter } = require('node:events');

/**
 * Async RAG processing contract. The API can enqueue a document and return a
 * job id immediately. In production, replace the in-memory adapter with
 * BullMQ + Redis without changing the processing contract.
 */
class RagJobQueue extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map();
  }

  enqueue(payload) {
    const id = `rag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.jobs.set(id, { id, status: 'queued', createdAt: new Date().toISOString(), payload });
    queueMicrotask(() => this.process(id));
    return id;
  }

  async process(id) {
    const job = this.jobs.get(id);
    if (!job) return;
    job.status = 'processing';
    this.emit('progress', job);
    try {
      if (typeof this.worker !== 'function') throw new Error('RAG worker is not configured');
      job.result = await this.worker(job.payload, progress => {
        job.progress = progress;
        this.emit('progress', job);
      });
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
    }
    this.emit('completed', job);
  }

  get(id) { return this.jobs.get(id) || null; }
}

function createBullMqAdapter({ Queue, connection, queueName = 'eduai-rag' }) {
  if (!Queue) throw new Error('BullMQ Queue constructor is required');
  const queue = new Queue(queueName, { connection });
  return { enqueue: payload => queue.add('document-ingestion', payload, { removeOnComplete: 100, removeOnFail: 100 }) };
}

module.exports = { RagJobQueue, createBullMqAdapter };
