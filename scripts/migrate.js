const fs = require('node:fs/promises');
const path = require('node:path');
const { query, close } = require('../src/db');

async function readSql(relativePath) {
  return fs.readFile(path.join(__dirname, '..', 'db', relativePath), 'utf8');
}

(async () => {
  try {
    const baseFiles = ['schema.sql', 'platform-v2.sql'];
    for (const file of baseFiles) {
      await query(await readSql(file));
      console.log(`Applied ${file}`);
    }

    const migrationDir = path.join(__dirname, '..', 'db', 'migrations');
    const migrationFiles = (await fs.readdir(migrationDir))
      .filter(file => /^\d+.*\.sql$/i.test(file))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    for (const file of migrationFiles) {
      await query(await readSql(path.join('migrations', file)));
      console.log(`Applied migration ${file}`);
    }

    console.log(`Database migration completed. ${baseFiles.length + migrationFiles.length} SQL files applied.`);
  } catch (error) {
    console.error(error?.message || error);
    process.exitCode = 1;
  } finally {
    await close();
  }
})();
