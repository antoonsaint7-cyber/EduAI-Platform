import fs from 'node:fs/promises';

const dataset = JSON.parse(await fs.readFile(new URL('./datasets/core.json', import.meta.url), 'utf8'));

// Offline evaluator: validates the dataset itself and enforces cheap, deterministic gates.
// Live-model grading is intentionally separate so ordinary CI remains fast and inexpensive.
const allowedModes = new Set(['student', 'teacher']);
const failures = [];

for (const test of dataset.cases) {
  if (!test.id || !test.input) failures.push(`${test.id || '<missing-id>'}: missing id/input`);
  if (!allowedModes.has(test.mode)) failures.push(`${test.id}: invalid mode`);
  if (!Array.isArray(test.criteria) || test.criteria.length === 0) failures.push(`${test.id}: missing criteria`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Offline eval dataset OK: ${dataset.cases.length} cases`);
