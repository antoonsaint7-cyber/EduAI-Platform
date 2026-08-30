'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { enqueueRagJob } = require('./queues');

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

async function malwareScan(filePath, scanner = process.env.CLAMAV_SOCKET || process.env.CLAMAV_HOST) {
  if (!scanner) {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_UNSCANNED_UPLOADS !== 'true') {
      throw new Error('Malware scanner is required before production uploads are accepted.');
    }
    return { clean: process.env.NODE_ENV !== 'production', skipped: true };
  }
  if (typeof scanner !== 'function') {
    throw new Error('Configured malware scanner adapter is not callable. Refusing to trust configuration alone.');
  }
  const result = await scanner(filePath);
  if (!result || result.clean !== true) return { clean: false, scanner: 'configured' };
  return { clean: true, scanner: 'configured' };
}

async function processUploadedDocument({ tenantId, documentId, filename, mimeType, size, localPath, objectKey, extract }) {
  validateUpload({ filename, mimeType, size });
  const scan = await malwareScan(localPath);
  if (!scan.clean) throw new Error('Upload failed malware scanning.');

  const content = await extract(localPath, mimeType);
  if (!content || !String(content.text || content).trim()) throw new Error('No extractable text found in document.');

  const checksum = await sha256File(localPath);
  const text = String(content.text || content).trim();
  await enqueueRagJob({ tenant_id: tenantId, document_id: documentId, source_title: filename, object_key: objectKey, checksum, text });
  return { documentId, filename, checksum, queued: true };
}

module.exports = { ALLOWED_TYPES, MAX_BYTES, validateUpload, sha256File, malwareScan, processUploadedDocument };
