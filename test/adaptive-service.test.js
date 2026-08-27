'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeQuestionSkill,
  normalizeDifficulty,
  gradeAssessmentQuestions,
  aggregateSkillEvidence,
  applyAssessmentResult,
} = require('../src/adaptive-service');

test('assessment questions normalize skill and difficulty metadata', () => {
  assert.equal(normalizeQuestionSkill({ skill: 'Fractions' }), 'Fractions');
  assert.equal(normalizeQuestionSkill({ topic: 'Algebra' }), 'Algebra');
  assert.equal(normalizeQuestionSkill({}), null);
  assert.equal(normalizeDifficulty(0.6), 60);
  assert.equal(normalizeDifficulty(80), 80);
});

test('grading preserves skill evidence for every question', () => {
  const graded = gradeAssessmentQuestions([
    { skill: 'fractions', difficulty: 0.4, answer_index: 1 },
    { skill: 'fractions', difficulty: 0.6, answer_index: 0 },
    { topic: 'algebra', difficulty: 70, answer_index: 2 },
  ], [1, 3, 2]);

  assert.deepEqual(graded.map(x => x.skill), ['fractions', 'fractions', 'algebra']);
  assert.deepEqual(graded.map(x => x.correct), [true, false, true]);
  assert.deepEqual(graded.map(x => x.difficulty), [40, 60, 70]);
});

test('skill evidence aggregates scores independently', () => {
  const evidence = aggregateSkillEvidence([
    { skill: 'fractions', correct: true, difficulty: 40 },
    { skill: 'fractions', correct: false, difficulty: 60 },
    { skill: 'algebra', correct: true, difficulty: 70 },
  ]);
  const fractions = evidence.find(x => x.skill === 'fractions');
  const algebra = evidence.find(x => x.skill === 'algebra');
  assert.equal(fractions.score, 50);
  assert.equal(fractions.difficulty, 50);
  assert.equal(fractions.attempts, 2);
  assert.equal(algebra.score, 100);
});

test('assessment result updates persistent skill mastery and returns weak skills', async () => {
  const rows = new Map();
  const db = {
    async query(sql, params) {
      if (sql.startsWith('SELECT mastery')) {
        const row = rows.get(params[2]);
        return { rows: row ? [row] : [] };
      }
      const skill = params[2];
      const row = {
        skill,
        mastery: params[3],
        attempts: params[4],
        last_score: params[5],
        last_difficulty: params[6],
        confidence: params[7],
        last_lesson_id: params[8],
      };
      rows.set(skill, row);
      return { rows: [row] };
    },
  };

  const result = await applyAssessmentResult(db, {
    tenantId: 'tenant-1',
    studentId: 'student-1',
    lessonId: 'lesson-1',
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
