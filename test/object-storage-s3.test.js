'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createS3ObjectStorage } = require('../src/infrastructure/object-storage-s3');

test('S3 adapter uploads private tenant object with metadata', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'eduai-s3-'));
  const file = path.join(dir, 'lesson.pdf');
  await fs.writeFile(file, Buffer.from('lesson content'));
  let received;
  const storage = createS3ObjectStorage({
    bucket: 'eduai-private',
    client: {
      async putObject(input) {
        received = input;
        return { ETag: '"abc"' };
      },
    },
  });

  const result = await storage.putPrivateObject({
    localPath: file,
    objectKey: 'tenants/school-a/documents/doc-1/abc.pdf',
    contentType: 'application/pdf',
    metadata: { tenantId: 'school-a', documentId: 'doc-1', checksum: 'abc' },
  });

  assert.equal(result.private, true);
  assert.equal(result.objectKey, received.Key);
  assert.equal(received.Bucket, 'eduai-private');
  assert.equal(received.ACL, 'private');
  assert.equal(received.ContentType, 'application/pdf');
  assert.deepEqual(received.Metadata, { tenantId: 'school-a', documentId: 'doc-1', checksum: 'abc' });
  assert.deepEqual(received.Body, Buffer.from('lesson content'));
});

test('S3 adapter rejects missing client or bucket', () => {
  assert.throws(() => createS3ObjectStorage({ bucket: 'x' }), /S3-compatible client/);
  assert.throws(() => createS3ObjectStorage({ client: { putObject() {} } }), /S3 bucket/);
});
