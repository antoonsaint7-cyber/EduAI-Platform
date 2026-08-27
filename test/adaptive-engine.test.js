'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  masteryUpdate,
  classify,
  buildKnowledgeProfile,
  targetDifficulty,
  rankNextQuestions,
  buildDynamicPath,
  recommendNextStep,
} = require('../src/adaptive-engine');

test('mastery update stays bounded and reflects new evidence', () => {
  const next = masteryUpdate(40, 90, 0.8, 0.9);
  assert.ok(next > 40 && next <= 100);
});

test('mastery classification is deterministic', () => {
  assert.equal(classify(20), 'needs_support');
  assert.equal(classify(65), 'developing');
  assert.equal(classify(82), 'proficient');
  assert.equal(classify(95), 'mastered');
});

test('knowledge profile aggregates attempts by skill', () => {
  const profile = buildKnowledgeProfile([
    { skill: 'fractions', score: 30, difficulty: 0.4, confidence: 0.4 },
    { skill: 'fractions', score: 70, difficulty: 0.5, confidence: 0.6 },
    { skill: 'algebra', score: 90, difficulty: 0.7, confidence: 0.8 },
  ]);
  const fractions = profile.find(x => x.skill === 'fractions');
  assert.equal(fractions.attempts, 2);
  assert.equal(fractions.weak, true);
});

test('target difficulty increases with mastery', () => {
  assert.ok(targetDifficulty(35) < targetDifficulty(65));
  assert.ok(targetDifficulty(65) < targetDifficulty(90));
});

test('question ranking favors weak skills at an appropriate difficulty', () => {
  const profile = [{ skill: 'fractions', mastery: 35 }];
  const ranked = rankNextQuestions([
    { id: 'hard', skill: 'fractions', difficulty: 95 },
    { id: 'fit', skill: 'fractions', difficulty: 30 },
    { id: 'strong', skill: 'algebra', difficulty: 75 },
  ], profile);
  assert.equal(ranked[0].id, 'fit');
  assert.equal(ranked[0].recommended_difficulty, 30);
});

test('dynamic path prioritizes weakest non-mastered skills', () => {
  const path = buildDynamicPath([
    { skill: 'geometry', mastery: 88 },
    { skill: 'fractions', mastery: 32 },
    { skill: 'algebra', mastery: 61 },
    { skill: 'history', mastery: 94 },
  ], 3);
  assert.deepEqual(path.map(x => x.skill), ['fractions', 'algebra', 'geometry']);
  assert.equal(path[0].action, 'reteach');
  assert.equal(path[1].action, 'practice');
});

test('next-step recommendations connect skills to lessons', () => {
  const result = recommendNextStep(
    [{ skill: 'fractions', mastery: 42 }],
    [{ id: 17, title: 'Fractions Basics', skill: 'fractions' }],
    1,
  );
  assert.equal(result[0].lesson_id, 17);
  assert.equal(result[0].lesson_title, 'Fractions Basics');
});
