'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { enqueueRagJob } = require('./queues');
const { requireStorageAdapter, buildTenantObjectKey, assertPrivateStorageResult } = require('./object-storage');

const ALLOWED_TYPES = new Map([
  ['application/pdf', '.pdf'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
  ['application/vnd.openxmlformats-officedocument.presentationml.presentation', '.pptx'],
]);
const MAX_BYTES = Number(process.env.UPLOAD_MAX_BYTES || 25 * 1024 * 1024);

function validateUpload({ filename, mimeType, size }) {
  const ext = path.extname(filename || '').toLowerCase();
  if (!ALLOWED_TYPES.has(mimeType) || ALLOWED_TYPES.get(mimeType) !== ext) {
    throw new Error('Unsupported or mismatched document type. Allowed: PDF, DOCX, PPTX.');
  }
  if (!Number.isInteger(size) || size <= 0 || size > MAX_BYTES) {
    throw new Error(`File size must be between 1 byte and ${MAX_BYTES} bytes.`);
  }
  return { extension: ext, mimeType };
}

async function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  const data = await fs.readFile(filePath);
  hash.update(data);
  return hash.digest('hex');
}

async function malwareScan(filePath, scanner) {
  if (typeof scanner !== 'function') {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_UNSCANNED_UPLOADS !== 'true') {
      throw new Error('Malware scanner adapter is required before production uploads are accepted.');
    }
    return { clean: process.env.NODE_ENV !== 'production', skipped: true };
  }
  const result = await scanner(filePath);
  if (!result || result.clean !== true) return { clean: false, scanner: 'configured' };
  return { clean: true, scanner: 'configured' };
}

async function processUploadedDocument({
  tenantId,
  documentId,
  filename,
  mimeType,
  size,
  localPath,
  objectKey,
  scanner,
  storage,
  extract,
}) {
  const validated = validateUpload({ filename, mimeType, size });
  const scan = await malwareScan(localPath, scanner);
  if (!scan.clean) throw new Error('Upload failed malware scanning.');

  const checksum = await sha256File(localPath);
  const resolvedObjectKey = objectKey || buildTenantObjectKey({
    tenantId,
    documentId,
    checksum,
    extension: validated.extension,
  });

  const objectStorage = requireStorageAdapter(storage);
  const uploaded = await objectStorage.putPrivateObject({
    localPath,
    objectKey: resolvedObjectKey,
    contentType: mimeType,
    metadata: { tenantId: String(tenantId), documentId: String(documentId), checksum },
  });
  const stored = assertPrivateStorageResult(uploaded);
  if (stored.objectKey !== resolvedObjectKey) {
    throw new Error('Object storage returned an unexpected object key.');
  }

  const content = await extract(localPath, mimeType);
  if (!content || !String(content.text || content).trim()) {
    throw new Error('No extractable text found in document.');
  }

  const text = String(content.text || content).trim();
  await enqueueRagJob({
    tenant_id: tenantId,
    document_id: documentId,
    source_title: filename,
    object_key: resolvedObjectKey,
    checksum,
    text,
  });
  return { documentId, filename, checksum, objectKey: resolvedObjectKey, queued: true };
}

module.exports = {
  ALLOWED_TYPES,
  MAX_BYTES,
  validateUpload,
  sha256File,
  malwareScan,
  processUploadedDocument,
};
