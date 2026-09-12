'use strict';

const { applyAssessmentResult } = require('./adaptive-service');

async function applyAdaptiveAssessment({ query, user, assessment, questions, answers }) {
  if (user?.role !== 'student') throw new Error('Adaptive assessment requires a student user.');

  return applyAssessmentResult({ query }, {
    tenantId: user.tenant_id,
    studentId: user.id,
    assessmentId: assessment.id,
    lessonId: assessment.lesson_id,
    subject: assessment.subject,
    questions,
    answers,
  });
}

module.exports = { applyAdaptiveAssessment };
