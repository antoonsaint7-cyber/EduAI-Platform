'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { applyAdaptiveAssessment } = require('../src/adaptive-api');

test('adaptive API adapter persists skill evidence for a student assessment', async () => {
  const rows = new Map();
  const query = async (sql, params) => {
    if (sql.startsWith('SELECT mastery')) {
      const row = rows.get(params[2]);
      return { rows: row ? [row] : [] };
    }
    const row = {
      skill: params[2],
      mastery: params[3],
      attempts: params[4],
      last_score: params[5],
      last_difficulty: params[6],
      confidence: params[7],
      last_lesson_id: params[8],
    };
    rows.set(params[2], row);
    return { rows: [row] };
  };

  const result = await applyAdaptiveAssessment({
    query,
    user: { id: 'student-1', tenant_id: 'tenant-1', role: 'student' },
    assessment: { lesson_id: 'lesson-1' },
    questions: [
      { skill: 'fractions', difficulty: 0.3, answer_index: 0 },
      { skill: 'fractions', difficulty: 0.3, answer_index: 0 },
      { skill: 'algebra', difficulty: 0.7, answer_index: 0 },
    ],
    answers: [1, 1, 0],
  });

  assert.equal(result.updated.length, 2);
  assert.ok(result.weakSkills.includes('fractions'));
  assert.equal(rows.get('fractions').attempts, 2);
  assert.equal(rows.get('algebra').attempts, 1);
});

test('adaptive API adapter rejects non-student callers', async () => {
  await assert.rejects(
    () => applyAdaptiveAssessment({
      query: async () => ({ rows: [] }),
      user: { id: 'teacher-1', tenant_id: 'tenant-1', role: 'teacher' },
      assessment: { lesson_id: 'lesson-1' },
      questions: [],
      answers: [],
    }),
    /student user/,
  );
});
