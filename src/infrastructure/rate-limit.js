import { getRedis } from './redis.js';

const localBuckets = new Map();

export async function consumeRateLimit(key, limit = 60, windowSeconds = 60) {
  const redis = getRedis();
  if (redis) {
    const bucket = `rate:${key}`;
    const count = await redis.incr(bucket);
    if (count === 1) await redis.expire(bucket, windowSeconds);
    return { allowed: count <= limit, remaining: Math.max(0, limit - count), resetSeconds: Number(await redis.ttl(bucket)) };
  }
  const now = Date.now();
  const existing = localBuckets.get(key);
  if (!existing || now >= existing.resetAt) {
    localBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1, resetSeconds: windowSeconds };
  }
  existing.count += 1;
  return { allowed: existing.count <= limit, remaining: Math.max(0, limit - existing.count), resetSeconds: Math.ceil((existing.resetAt - now) / 1000) };
}
