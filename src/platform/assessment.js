const crypto = require('node:crypto');

function normalizeQuestion(question) {
  return { id: question.id || crypto.randomUUID(), type: question.type || 'mcq', question: String(question.question || '').trim(), options: Array.isArray(question.options) ? question.options : [], answer: question.answer, difficulty: ['easy','medium','hard'].includes(question.difficulty) ? question.difficulty : 'medium', explanation: question.explanation || '' };
}

function gradeAttempt(questions, answers) {
  const byId = new Map((answers || []).map((a) => [a.questionId, a.answer]));
  let correct = 0;
  const results = questions.map((q) => { const answer = byId.get(q.id); const ok = answer !== undefined && String(answer).trim() === String(q.answer).trim(); if (ok) correct += 1; return { questionId: q.id, correct: ok, answer }; });
  return { correct, total: questions.length, score: questions.length ? correct / questions.length : 0, results };
}

module.exports = { normalizeQuestion, gradeAttempt };
