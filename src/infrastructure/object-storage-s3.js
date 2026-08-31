'use strict';

/**
 * S3-compatible adapter boundary.
 * The concrete SDK/client is injected so the core does not depend on a cloud vendor.
 */
function createS3ObjectStorage({ client, bucket }) {
  if (!client || typeof client.putObject !== 'function') {
    throw new Error('S3-compatible client with putObject() is required.');
  }
  if (!bucket || typeof bucket !== 'string') {
    throw new Error('S3 bucket is required.');
  }

  return {
    async putPrivateObject({ localPath, objectKey, contentType, metadata = {} }) {
      if (!localPath || !objectKey) throw new Error('localPath and objectKey are required.');
      const result = await client.putObject({
        Bucket: bucket,
        Key: objectKey,
        Body: localPath,
        ContentType: contentType,
        Metadata: Object.fromEntries(Object.entries(metadata).map(([key, value]) => [key, String(value)])),
        ACL: 'private',
      });
      return { private: true, objectKey, etag: result?.ETag || result?.etag || null };
    },
  };
}

module.exports = { createS3ObjectStorage };
