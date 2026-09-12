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

test('assessment result updates skill mastery and topic mastery from quiz evidence', async () => {
  const rows = new Map();
  const topicRows = new Map();
  const evidenceRows = [];
  const db = {
    async query(sql, params) {
      if (sql.startsWith('SELECT mastery')) {
        const row = rows.get(params[2]);
        return { rows: row ? [row] : [] };
      }
      if (sql.startsWith('INSERT INTO assessment_evidence')) {
        evidenceRows.push({ assessmentId: params[2], topic: params[5], score: params[6], attempts: params[7] });
        return { rows: [] };
      }
      if (sql.startsWith('INSERT INTO topic_mastery')) {
        const key = `${params[2]}:${params[3]}`;
        const existing = topicRows.get(key);
        const mastery = existing ? Math.round((existing.mastery * 0.7 + Number(params[4]) * 0.3) * 100) / 100 : Number(params[4]);
        const row = { id: `topic-${topicRows.size + 1}`, subject: params[2], topic: params[3], mastery, evidence_count: (existing?.evidence_count || 0) + Number(params[5]), updated_at: new Date() };
        topicRows.set(key, row);
        return { rows: [row] };
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
    assessmentId: 'assessment-1',
    lessonId: 'lesson-1',
    subject: 'Math',
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
  assert.equal(evidenceRows.length, 2);
  assert.equal(evidenceRows.find(x => x.topic === 'fractions').score, 0);
  assert.equal(topicRows.get('Math:fractions').mastery, 0);
  assert.equal(topicRows.get('Math:algebra').mastery, 100);
});
