const Redis = require('ioredis');
let client;
function getRedis() { if (!process.env.REDIS_URL) return null; if (!client) client = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: true }); return client; }
async function closeRedis() { if (client) { await client.quit(); client = undefined; } }
module.exports = { getRedis, closeRedis };
