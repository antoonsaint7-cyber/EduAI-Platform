const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanJson, validateLesson, validateCourse, validateQuiz } = require('../src/ai-content');

test('cleanJson parses fenced JSON payloads', () => {
  const value = cleanJson('```json\n{"title":"درس"}\n```');
  assert.equal(value, '{"title":"درس"}');
});

test('cleanJson leaves plain JSON unchanged', () => {
  const value = cleanJson('{"questions":[]}');
  assert.equal(value, '{"questions":[]}');
});

test('validateLesson accepts a bounded lesson schema', () => {
  const lesson = validateLesson({ title: 'الكسور', objectives: ['فهم الكسر'], sections: [{ heading: 'مقدمة', body: 'شرح' }], examples: ['مثال'] });
  assert.equal(lesson.title, 'الكسور');
});

test('validateLesson rejects malformed sections', () => {
  assert.throws(() => validateLesson({ title: 'درس', objectives: ['هدف'], sections: [{ heading: 'مقدمة' }], examples: [] }), /body/);
});

test('validateCourse enforces the 3-8 lesson range', () => {
  const lesson = { title: 'درس', objective: 'هدف' };
  assert.equal(validateCourse({ title: 'كورس', lessons: [lesson, lesson, lesson] }).lessons.length, 3);
  assert.throws(() => validateCourse({ title: 'كورس', lessons: [lesson, lesson] }), /عدد دروس/);
});

test('validateQuiz accepts only automatically gradable question types', () => {
  const question = { type: 'multiple_choice', question: 'كم؟', options: ['1', '2', '3', '4'], answer_index: 1, explanation: 'الإجابة 2' };
  assert.equal(validateQuiz({ title: 'اختبار', questions: Array(5).fill(question) }).questions.length, 5);
  assert.throws(() => validateQuiz({ title: 'اختبار', questions: Array(5).fill({ ...question, type: 'essay' }) }), /نوع سؤال/);
});
