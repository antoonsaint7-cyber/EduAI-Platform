import { getRedis } from './redis.js';

const memory = new Map();

export async function cacheGet(key) {
  const redis = getRedis();
  if (redis) return redis.get(key);
  const item = memory.get(key);
  if (!item || item.expiresAt <= Date.now()) { memory.delete(key); return null; }
  return item.value;
}

export async function cacheSet(key, value, ttlSeconds = 60) {
  const redis = getRedis();
  if (redis) { await redis.set(key, value, 'EX', ttlSeconds); return; }
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheDelete(key) {
  const redis = getRedis();
  if (redis) { await redis.del(key); return; }
  memory.delete(key);
}
