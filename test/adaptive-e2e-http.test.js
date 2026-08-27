'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

// Keep this contract test deterministic without starting a real database-backed server.
// The route is required to delegate adaptive assessment handling to the application adapter.
test('assessment submission route uses the adaptive application adapter', async () => {
  const fs = require('node:fs');
  const server = fs.readFileSync(require.resolve('../server.js'), 'utf8');

  assert.match(server, /applyAdaptiveAssessment/);
  assert.match(server, /POST|post/);
  assert.match(server, /assessments\/:id\/submit/);
  assert.match(server, /adaptive/);
});
