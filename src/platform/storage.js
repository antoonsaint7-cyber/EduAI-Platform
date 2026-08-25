const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const root = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage');
const driver = process.env.STORAGE_DRIVER || (process.env.NODE_ENV === 'production' ? 's3' : 'local');
const s3 = driver === 's3' ? new S3Client({ region: process.env.S3_REGION || 'auto', endpoint: process.env.S3_ENDPOINT || undefined, forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true', credentials: process.env.S3_ACCESS_KEY_ID ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY } : undefined }) : null;
async function put(filePath, originalName) {
  const id = crypto.randomUUID();
  const key = `${process.env.S3_PREFIX || 'curricula'}/${id}-${path.basename(originalName)}`;
  if (driver === 's3') {
    if (!process.env.S3_BUCKET) throw new Error('S3_BUCKET is required when STORAGE_DRIVER=s3');
    await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: await fs.readFile(filePath), ContentType: 'application/octet-stream', ServerSideEncryption: process.env.S3_SSE || undefined }));
    return { id, key, name: originalName, driver: 's3' };
  }
  await fs.mkdir(root, { recursive: true });
  const destination = path.join(root, `${id}-${path.basename(originalName)}`);
  await fs.copyFile(filePath, destination);
  return { id, path: destination, name: originalName, driver: 'local' };
}
async function remove(storagePath) { if (storagePath && driver === 'local') await fs.unlink(storagePath).catch(() => {}); }
module.exports = { put, remove };
