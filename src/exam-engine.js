'use strict';

const TYPES = new Set(['mcq', 'true_false', 'short_answer', 'essay', 'matching']);

function normalizeQuestion(question, index = 0) {
  if (!question || typeof question !== 'object') return null;
  const type = TYPES.has(question.type) ? question.type : 'mcq';
  const prompt = String(question.prompt || question.question || '').trim().slice(0, 2000);
  if (!prompt) return null;
  const item = { id: String(question.id || `q-${index + 1}`), type, prompt, points: Math.max(1, Math.min(20, Number(question.points) || 1)) };
  if (type === 'mcq') {
    item.options = Array.isArray(question.options) ? question.options.map(String).map(v => v.trim()).filter(Boolean).slice(0, 8) : [];
    item.answer_index = Number.isInteger(question.answer_index) ? question.answer_index : null;
    if (item.options.length < 2 || item.answer_index === null || item.answer_index < 0 || item.answer_index >= item.options.length) return null;
  } else if (type === 'true_false') {
    item.answer = Boolean(question.answer);
  } else if (type === 'matching') {
    item.pairs = Array.isArray(question.pairs) ? question.pairs.slice(0, 12).map(pair => ({ left: String(pair?.left || ''), right: String(pair?.right || '') })).filter(pair => pair.left && pair.right) : [];
    if (!item.pairs.length) return null;
  } else {
    item.answer = String(question.answer || '').trim().slice(0, 2000);
  }
  item.explanation = String(question.explanation || '').trim().slice(0, 2000);
  return item;
}

function normalizeExam(input) {
  const questions = (Array.isArray(input?.questions) ? input.questions : []).map(normalizeQuestion).filter(Boolean);
  const timeLimitMinutes = Math.max(1, Math.min(240, Number(input?.time_limit_minutes) || 30));
  return {
    title: String(input?.title || 'EduAI Assessment').trim().slice(0, 200),
    instructions: String(input?.instructions || '').trim().slice(0, 3000),
    time_limit_minutes: timeLimitMinutes,
    randomize_questions: input?.randomize_questions !== false,
    questions,
    total_points: questions.reduce((sum, q) => sum + q.points, 0),
  };
}

function gradeExam(exam, answers = []) {
  const normalized = normalizeExam(exam);
  const answerList = Array.isArray(answers) ? answers : [];
  let earned = 0;
  const review = normalized.questions.map((q, index) => {
    const answer = answerList[index];
    let correct = false;
    let autoGradable = false;
    if (q.type === 'mcq') { autoGradable = true; correct = Number(answer) === q.answer_index; }
    else if (q.type === 'true_false') { autoGradable = true; correct = Boolean(answer) === q.answer; }
    else if (q.type === 'short_answer') { autoGradable = true; correct = typeof answer === 'string' && q.answer && answer.trim().toLowerCase() === q.answer.trim().toLowerCase(); }
    if (correct) earned += q.points;
    return { id: q.id, correct, auto_gradable: autoGradable, earned_points: correct ? q.points : 0, points: q.points, explanation: q.explanation };
  });
  return { earned_points: earned, total_points: normalized.total_points, percentage: normalized.total_points ? Math.round((earned / normalized.total_points) * 10000) / 100 : 0, review };
}

module.exports = { TYPES: [...TYPES], normalizeQuestion, normalizeExam, gradeExam };
