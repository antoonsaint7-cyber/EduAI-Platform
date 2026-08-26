import Redis from 'ioredis';

let client;

export function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (!client) client = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: true });
  return client;
}

export async function closeRedis() {
  if (client) { await client.quit(); client = undefined; }
}
