const { Pool } = require('pg');

const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_SIZE || 10),
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
}) : null;

async function query(text, params = []) {
  if (!pool) throw new Error('DATABASE_URL is required');
  return pool.query(text, params);
}

async function withTransaction(fn) {
  if (!pool) throw new Error('DATABASE_URL is required');
  const client = await pool.connect();
  try { await client.query('BEGIN'); const result = await fn(client); await client.query('COMMIT'); return result; }
  catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}

module.exports = { pool, query, withTransaction };
