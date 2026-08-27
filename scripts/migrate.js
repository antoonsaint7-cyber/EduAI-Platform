const fs = require('node:fs/promises');
const path = require('node:path');
const { query, withTransaction, close } = require('../src/db');

const DB_DIR = path.join(__dirname, '..', 'db');
const MIGRATIONS_DIR = path.join(DB_DIR, 'migrations');

async function readSql(filePath) {
  return fs.readFile(filePath, 'utf8');
}

async function listMigrations() {
  const entries = await fs.readdir(MIGRATIONS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /^\d+.*\.sql$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
}

async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  // Base schema layers are idempotent and must exist before numbered
  // migrations can reference their tables/functions.
  for (const file of ['schema.sql', 'platform-v2.sql']) {
    await query(await readSql(path.join(DB_DIR, file)));
    console.log(`Applied base schema layer: ${file}`);
  }

  const migrations = await listMigrations();
  for (const file of migrations) {
    const { rows } = await query(
      'SELECT 1 FROM schema_migrations WHERE version = $1',
      [file],
    );
    if (rows.length) {
      console.log(`Skipped already-applied migration: ${file}`);
      continue;
    }

    const sql = await readSql(path.join(MIGRATIONS_DIR, file));
    await withTransaction(async (client) => {
      // Serialize migration runners and make each migration atomic.
      await client.query('SELECT pg_advisory_xact_lock(732145)');
      const { rows: applied } = await client.query(
        'SELECT 1 FROM schema_migrations WHERE version = $1',
        [file],
      );
      if (applied.length) return;

      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations(version) VALUES ($1)',
        [file],
      );
    });
    console.log(`Applied migration: ${file}`);
  }

  const { rows } = await query(
    'SELECT version FROM schema_migrations ORDER BY version',
  );

  const appliedVersions = new Set(rows.map(({ version }) => version));
  const missing = migrations.filter((file) => !appliedVersions.has(file));
  if (missing.length) {
    throw new Error(`Migration ledger is incomplete: ${missing.join(', ')}`);
  }

  console.log(`Database migration completed. ${rows.length} numbered migration(s) applied.`);
}

migrate()
  .catch((error) => {
    console.error(error?.stack || error?.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await close();
  });
