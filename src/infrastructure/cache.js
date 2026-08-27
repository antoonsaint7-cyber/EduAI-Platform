const { getRedis } = require('./redis');
const memory = new Map();
async function cacheGet(key) { const redis = getRedis(); if (redis) return redis.get(key); const item = memory.get(key); if (!item || item.expiresAt <= Date.now()) { memory.delete(key); return null; } return item.value; }
async function cacheSet(key, value, ttlSeconds = 60) { const ttl = Math.max(1, Number(ttlSeconds) || 60); const redis = getRedis(); if (redis) { await redis.set(key, value, 'EX', ttl); return; } memory.set(key, { value, expiresAt: Date.now() + ttl * 1000 }); }
async function cacheDelete(key) { const redis = getRedis(); if (redis) { await redis.del(key); return; } memory.delete(key); }
module.exports = { cacheGet, cacheSet, cacheDelete };
