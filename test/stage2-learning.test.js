'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { updateMastery, classifyMastery, recommendTopics, buildLearningPath, chunkDocument, buildGroundedContext } = require('../src/stage2-learning');
const { normalizeExam, gradeExam } = require('../src/exam-engine');

test('adaptive learning updates mastery and prioritizes weak skills', () => {
  assert.equal(updateMastery(40, 80), 52);
  assert.equal(classifyMastery(45), 'needs_support');
  const topics = recommendTopics([{ topic: 'Algebra', mastery: 82 }, { topic: 'Fractions', mastery: 31 }, { topic: 'Geometry', mastery: 60 }], { limit: 2 });
  assert.deepEqual(topics.map(t => t.topic), ['Fractions', 'Geometry']);
  assert.equal(buildLearningPath(topics)[0].action, 'review_and_practice');
});

test('grounded retrieval preserves source citations and chunk boundaries', () => {
  const chunks = chunkDocument({ id: 'doc-1', title: 'Math Book', page: 4, text: 'Fractions represent parts of a whole. Algebra uses variables. '.repeat(40) }, { chunkSize: 500, overlap: 50 });
  assert.ok(chunks.length > 1);
  const hits = buildGroundedContext('fractions whole', chunks, { limit: 2 });
  assert.ok(hits.length >= 1);
  assert.equal(hits[0].citation, 'Math Book, p. 4');
});

test('advanced exam normalization and grading are deterministic', () => {
  const exam = normalizeExam({ title: 'Midterm', time_limit_minutes: 45, questions: [
    { type: 'mcq', prompt: '2 + 2 = ?', options: ['3', '4'], answer_index: 1, points: 2 },
    { type: 'true_false', prompt: 'The earth orbits the sun.', answer: true, points: 1 },
    { type: 'essay', prompt: 'Explain photosynthesis.', points: 5, answer: 'teacher review' },
  ] });
  assert.equal(exam.total_points, 8);
  const result = gradeExam(exam, [1, true, 'student answer']);
  assert.equal(result.earned_points, 3);
  assert.equal(result.percentage, 37.5);
  assert.equal(result.review[2].auto_gradable, false);
});
