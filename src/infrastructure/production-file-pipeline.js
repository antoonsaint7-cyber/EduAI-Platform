'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { buildDocumentJobId } = require('./document-ingestion');
const { enqueueRagJob } = require('./queues');
const { extractDocument } = require('./real-extractors');
const { createClamAvScanner } = require('./malware-scanner-clamav');

const ALLOWED_TYPES = new Map([
  ['application/pdf', '.pdf'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
  ['application/vnd.openxmlformats-officedocument.presentationml.presentation', '.pptx'],
]);
const DEFAULT_MAX_BYTES = 25 * 1024 * 1024;

function validateUpload({ filename, mimeType, size, maxBytes = Number(process.env.UPLOAD_MAX_BYTES || DEFAULT_MAX_BYTES) }) {
  const ext = path.extname(filename || '').toLowerCase();
  if (!ALLOWED_TYPES.has(mimeType) || ALLOWED_TYPES.get(mimeType) !== ext) {
    throw new Error('Unsupported or mismatched document type. Allowed: PDF, DOCX, PPTX.');
  }
  if (!Number.isInteger(size) || size <= 0 || size > maxBytes) {
    throw new Error(`File size must be between 1 byte and ${maxBytes} bytes.`);
  }
  return { extension: ext, mimeType };
}

async function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  const file = await fs.open(filePath, 'r');
  try {
    for await (const chunk of file.readableWebStream()) hash.update(Buffer.from(chunk));
  } finally {
    await file.close();
  }
  return hash.digest('hex');
}

function buildPrivateObjectKey({ tenantId, documentId, checksum, filename }) {
  const tenant = String(tenantId || '').trim();
  const document = String(documentId || '').trim();
  const digest = String(checksum || '').trim().toLowerCase();
  const safeName = path.basename(String(filename || 'document')).replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!tenant || !document || !/^[a-f0-9]{64}$/.test(digest)) {
    throw new Error('tenantId, documentId and SHA-256 checksum are required for object storage.');
  }
  return `tenants/${encodeURIComponent(tenant)}/documents/${encodeURIComponent(document)}/${digest}/${safeName}`;
}

async function runProductionFilePipeline({
  tenantId,
  documentId,
  filename,
  mimeType,
  size,
  localPath,
  objectStorage,
  scanner = createClamAvScanner(),
  extract = extractDocument,
  enqueue = enqueueRagJob,
}) {
  const tenant = String(tenantId || '').trim();
  const document = String(documentId || '').trim();
  if (!tenant || !document || !localPath) throw new Error('tenantId, documentId and localPath are required.');
  validateUpload({ filename, mimeType, size });
  if (!objectStorage || typeof objectStorage.putPrivateObject !== 'function') {
    throw new Error('Private object storage adapter is required before production ingestion.');
  }
  if (!scanner || typeof scanner.scan !== 'function') {
    throw new Error('Malware scanner adapter is required before production ingestion.');
  }

  const checksum = await sha256File(localPath);
  const scan = await scanner.scan(localPath);
  if (!scan || scan.clean !== true) {
    if (scan?.clean === false) throw new Error('Upload rejected by malware scanner.');
    throw new Error('Malware scanner returned no clean verdict.');
  }

  const objectKey = buildPrivateObjectKey({ tenantId: tenant, documentId: document, checksum, filename });
  const stored = await objectStorage.putPrivateObject({
    localPath,
    objectKey,
    contentType: mimeType,
    metadata: { tenant_id: tenant, document_id: document, checksum },
  });
  if (!stored?.private || stored.objectKey !== objectKey) {
    throw new Error('Object storage must confirm a private object with the requested tenant-scoped key.');
  }

  const extracted = await extract({ filePath: localPath, mimeType });
  const text = String(extracted?.text || '').trim();
  if (!text) throw new Error('Document extraction produced no text.');

  const jobId = buildDocumentJobId({ tenantId: tenant, documentId: document, checksum });
  const job = await enqueue({
    tenant_id: tenant,
    document_id: document,
    source_title: String(filename || document),
    object_key: objectKey,
    checksum,
    text,
    metadata: extracted.metadata || {},
    pages: extracted.pages || [],
  }, { jobId });

  return { tenant_id: tenant, document_id: document, checksum, object_key: objectKey, job_id: jobId, queued: true, job };
}

module.exports = { ALLOWED_TYPES, DEFAULT_MAX_BYTES, validateUpload, sha256File, buildPrivateObjectKey, runProductionFilePipeline };
