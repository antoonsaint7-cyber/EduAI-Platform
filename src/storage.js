const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const s3 = process.env.S3_BUCKET ? new S3Client({ region: process.env.S3_REGION || 'us-east-1' }) : null;
async function uploadObject({ tenantId, filename, content, contentType='application/octet-stream' }) {
  if (!s3) throw new Error('S3 is not configured');
  const safe = String(filename).replace(/[^a-zA-Z0-9._-]/g,'_');
  const key = `${tenantId}/${crypto.randomUUID()}-${safe}`;
  await s3.send(new PutObjectCommand({Bucket:process.env.S3_BUCKET,Key:key,Body:content,ContentType:contentType,ServerSideEncryption:'AES256'}));
  return { key, bucket:process.env.S3_BUCKET };
}
module.exports={uploadObject};
