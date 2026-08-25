const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl, max: Number(process.env.DB_POOL_SIZE || 10), ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined }) : null;

function requireDb() {
  if (!pool) throw new Error('DATABASE_URL is required in production.');
  return pool;
}

async function query(text, params) { return requireDb().query(text, params); }

async function migrate() {
  const fs = require('node:fs/promises');
  const path = require('node:path');
  const sql = await fs.readFile(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8');
  await query(sql);
}

module.exports = { pool, query, migrate, requireDb };
