const fs = require('node:fs/promises');
const path = require('node:path');
const { query, close } = require('../src/db');

(async () => {
  try {
    const schema = await fs.readFile(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
    await query(schema);
    console.log('Database migration completed.');
  } catch (error) {
    console.error(error?.message || error);
    process.exitCode = 1;
  } finally {
    await close();
  }
})();
