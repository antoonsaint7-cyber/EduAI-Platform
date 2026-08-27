'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { applyAdaptiveAssessment } = require('../src/adaptive-api');

/**
 * End-to-end contract test for the student adaptive flow.
 * It exercises the same application service used by POST /api/assessments/:id/submit,
 * then verifies that persisted mastery produces weak-skill recommendations.
 */
test('student assessment flows into mastery and weak-skill recommendations', async () => {
  const mastery = new Map();

  const query = async (sql, params) => {
    if (sql.startsWith('SELECT mastery')) {
      const row = mastery.get(params[2]);
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
    mastery.set(params[2], row);
    return { rows: [row] };
  };

  const result = await applyAdaptiveAssessment({
    query,
    user: { id: 'student-e2e', tenant_id: 'tenant-e2e', role: 'student' },
    assessment: { lesson_id: 'lesson-e2e' },
    questions: [
      { skill: 'fractions', difficulty: 0.7, answer_index: 1 },
      { skill: 'fractions', difficulty: 0.7, answer_index: 1 },
      { skill: 'algebra', difficulty: 0.4, answer_index: 0 },
    ],
    answers: [0, 0, 0],
  });

  assert.equal(result.updated.length, 2);
  assert.ok(result.weakSkills.includes('fractions'));
  assert.equal(mastery.get('fractions').attempts, 2);
  assert.equal(mastery.get('fractions').last_lesson_id, 'lesson-e2e');
  assert.ok(result.recommendations.some((item) => item.skill === 'fractions'));
});
