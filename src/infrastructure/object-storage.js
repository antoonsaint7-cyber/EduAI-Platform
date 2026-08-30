'use strict';

function requireStorageAdapter(storage) {
  if (!storage || typeof storage.putPrivateObject !== 'function') {
    throw new Error('Private object-storage adapter is required.');
  }
  return storage;
}

function buildTenantObjectKey({ tenantId, documentId, checksum, extension }) {
  if (!tenantId || !documentId || !checksum || !extension) {
    throw new Error('tenantId, documentId, checksum and extension are required to build an object key.');
  }
  return `tenants/${encodeURIComponent(String(tenantId))}/documents/${encodeURIComponent(String(documentId))}/${checksum}${extension}`;
}

function assertPrivateStorageResult(result) {
  if (!result || result.private !== true || typeof result.objectKey !== 'string' || !result.objectKey) {
    throw new Error('Object storage adapter must confirm a private object and return objectKey.');
  }
  return result;
}

module.exports = { requireStorageAdapter, buildTenantObjectKey, assertPrivateStorageResult };
