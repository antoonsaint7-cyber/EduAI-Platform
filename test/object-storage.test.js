const test = require('node:test');
const assert = require('node:assert/strict');
const { requireStorageAdapter, buildTenantObjectKey, assertPrivateStorageResult } = require('../src/infrastructure/object-storage');

test('builds tenant-scoped object keys from immutable document checksum', () => {
  const key = buildTenantObjectKey({ tenantId: 'tenant/a', documentId: 'doc 1', checksum: 'abc123', extension: '.pdf' });
  assert.equal(key, 'tenants/tenant%2Fa/documents/doc%201/abc123.pdf');
});

test('rejects missing storage adapter', () => {
  assert.throws(() => requireStorageAdapter(null), /object-storage adapter is required/);
});

test('requires storage to confirm privacy', () => {
  assert.throws(() => assertPrivateStorageResult({ objectKey: 'x' }), /private object/);
  assert.deepEqual(assertPrivateStorageResult({ private: true, objectKey: 'x' }), { private: true, objectKey: 'x' });
});
