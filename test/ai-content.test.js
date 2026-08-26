const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanJson } = require('../src/ai-content');

test('cleanJson parses fenced JSON payloads', () => {
  const value = cleanJson('```json\n{"title":"درس"}\n```');
  assert.equal(value, '{"title":"درس"}');
});

test('cleanJson leaves plain JSON unchanged', () => {
  const value = cleanJson('{"questions":[]}');
  assert.equal(value, '{"questions":[]}');
});
