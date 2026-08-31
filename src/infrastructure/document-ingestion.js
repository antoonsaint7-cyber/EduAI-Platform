'use strict';

const crypto = require('node:crypto');
const { extractDocument } = require('./real-extractors');
const { enqueueRagJob } = require('./queues');

function buildDocumentJobId({ tenantId, documentId, checksum }) {
  const tenant = String(tenantId || '').trim();
  const document = String(documentId || '').trim();
  const digest = String(checksum || '').trim();
  if (!tenant || !document || !digest) {
    throw new Error('tenantId, documentId and checksum are required for RAG ingestion.');
  }
  // BullMQ job IDs cannot contain ':'. Keep the deterministic hash while using
  // a BullMQ-compatible prefix separator.
  return `rag-${crypto.createHash('sha256').update(`${tenant}:${document}:${digest}`).digest('hex')}`;
}

async function ingestDocument({
  tenantId,
  documentId,
  filename,
  mimeType,
  localPath,
  objectKey,
  checksum,
  extract = extractDocument,
  enqueue = enqueueRagJob,
}) {
  const tenant = String(tenantId || '').trim();
  const document = String(documentId || '').trim();
  const digest = String(checksum || '').trim();
  if (!tenant || !document || !localPath || !digest) {
    throw new Error('tenantId, documentId, localPath and checksum are required.');
  }

  const extracted = await extract({ filePath: localPath, mimeType });
  const text = String(extracted?.text || '').trim();
  if (!text) throw new Error('Document extraction produced no text.');

  const jobId = buildDocumentJobId({ tenantId: tenant, documentId: document, checksum: digest });
  const job = await enqueue({
    tenant_id: tenant,
    document_id: document,
    source_title: String(filename || document),
    object_key: objectKey || null,
    checksum: digest,
    text,
    metadata: extracted.metadata || {},
    pages: extracted.pages || [],
  }, { jobId });

  return { document_id: document, tenant_id: tenant, checksum: digest, job_id: jobId, queued: true, job };
}

module.exports = { buildDocumentJobId, ingestDocument };
