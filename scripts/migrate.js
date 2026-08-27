const fs = require('node:fs/promises');
const path = require('node:path');
const { query, close } = require('../src/db');

const DB_DIR = path.join(__dirname, '..', 'db');
const MIGRATIONS_DIR = path.join(DB_DIR, 'migrations');

async function readSql(filePath) {
  return fs.readFile(filePath, 'utf8');
}

async function listMigrations() {
  const entries = await fs.readdir(MIGRATIONS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /^\d+_.+\.sql$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
}

async function migrate() {
  await query('SELECT pg_advisory_lock(732145)');
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // These are the foundational, idempotent schema layers. They must exist
    // before numbered migrations can safely reference their tables/functions.
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

      const clientSql = await readSql(path.join(MIGRATIONS_DIR, file));
      await query('BEGIN');
      try {
        await query(clientSql);
        await query('INSERT INTO schema_migrations(version) VALUES ($1)', [file]);
        await query('COMMIT');
        console.log(`Applied migration: ${file}`);
      } catch (error) {
        await query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${error?.message || error}`);
      }
    }

    const { rows } = await query(
      'SELECT version FROM schema_migrations ORDER BY version',
    );
    console.log(`Database migration completed. ${rows.length} numbered migration(s) applied.`);
  } finally {
    await query('SELECT pg_advisory_unlock(732145)');
  }
}

migrate()
  .catch((error) => {
    console.error(error?.stack || error?.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await close();
  });
