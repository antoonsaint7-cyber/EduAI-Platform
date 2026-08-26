const fs = require('node:fs/promises');
const path = require('node:path');
const { query, close } = require('../src/db');

(async () => {
  try {
    for (const file of ['schema.sql', 'platform-v2.sql']) {
      const sql = await fs.readFile(path.join(__dirname, '..', 'db', file), 'utf8');
      await query(sql);
      console.log(`Applied ${file}`);
    }
    console.log('Database migration completed.');
  } catch (error) {
    console.error(error?.message || error);
    process.exitCode = 1;
  } finally {
    await close();
  }
})();
