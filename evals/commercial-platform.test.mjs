import assert from 'node:assert/strict';
import { updateMastery, nextDifficulty, nextReviewAt } from '../src/platform/learning.js';
import { normalizeQuestion, gradeAttempt } from '../src/platform/assessment.js';
import { PLANS, withinLimit } from '../src/platform/billing.js';

const improved = updateMastery(0.2, { correct: true, difficulty: 'medium', responseMs: 1000 });
assert.ok(improved > 0.2);
assert.equal(nextDifficulty(0.2), 'easy');
assert.equal(nextDifficulty(0.9), 'hard');
assert.match(nextReviewAt(0.2), /^\d{4}-/);
const q = normalizeQuestion({ question: '2+2?', answer: '4', difficulty: 'easy' });
assert.equal(gradeAttempt([q], [{ questionId: q.id, answer: '4' }]).score, 1);
assert.equal(gradeAttempt([q], [{ questionId: q.id, answer: '5' }]).score, 0);
assert.ok(PLANS.school.messages > PLANS.free.messages);
assert.equal(withinLimit('free', 'messages', 50), false);
console.log('Commercial platform evals passed');
