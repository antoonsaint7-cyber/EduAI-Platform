const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const root = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage');
async function put(filePath, originalName) {
  await fs.mkdir(root, { recursive: true });
  const id = crypto.randomUUID();
  const destination = path.join(root, `${id}-${path.basename(originalName)}`);
  await fs.copyFile(filePath, destination);
  return { id, path: destination, name: originalName };
}
async function remove(storagePath) { if (storagePath) await fs.unlink(storagePath).catch(() => {}); }
module.exports = { put, remove };
