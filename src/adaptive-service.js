'use strict';

const {
  clamp,
  masteryUpdate,
  buildKnowledgeProfile,
  rankNextQuestions,
  recommendNextStep,
} = require('./adaptive-engine');

function normalizeQuestionSkill(question) {
  const skill = question?.skill ?? question?.topic ?? question?.competency;
  return typeof skill === 'string' && skill.trim() ? skill.trim().slice(0, 160) : null;
}

function normalizeDifficulty(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 50;
  return clamp(numeric <= 1 ? numeric * 100 : numeric);
}

function normalizeAnswer(value) {
  const numeric = Number(value);
  return Number.isInteger(numeric) ? numeric : null;
}

function gradeAssessmentQuestions(questions = [], answers = []) {
  const safeQuestions = Array.isArray(questions) ? questions : [];
  const safeAnswers = Array.isArray(answers) ? answers : [];
  return safeQuestions.map((question, index) => {
    const selected = normalizeAnswer(safeAnswers[index]);
    const correctAnswer = normalizeAnswer(question?.answer_index);
    return {
      questionIndex: index,
      skill: normalizeQuestionSkill(question),
      difficulty: normalizeDifficulty(question?.difficulty),
      selected,
      correct: selected !== null && correctAnswer !== null && selected === correctAnswer,
    };
  });
}

function aggregateSkillEvidence(graded = []) {
  const buckets = new Map();
  for (const item of graded) {
    if (!item.skill) continue;
    const bucket = buckets.get(item.skill) || { skill: item.skill, score: 0, difficulty: 0, attempts: 0 };
    bucket.score += item.correct ? 100 : 0;
    bucket.difficulty += item.difficulty;
    bucket.attempts += 1;
    bucket.evidenceQuestionIndexes = bucket.evidenceQuestionIndexes || [];
    bucket.evidenceQuestionIndexes.push(item.questionIndex);
    buckets.set(item.skill, bucket);
  }
  return [...buckets.values()].map(bucket => ({
    ...bucket,
    score: bucket.attempts ? bucket.score / bucket.attempts : 0,
    difficulty: bucket.attempts ? bucket.difficulty / bucket.attempts : 50,
  }));
}

async function applyAssessmentResult(db, {
  tenantId,
  studentId,
  assessmentId = null,
  lessonId = null,
  subject = 'General',
  questions = [],
  answers = [],
}) {
  if (!db || typeof db.query !== 'function') throw new TypeError('A database client with query() is required');
  if (!tenantId || !studentId) throw new TypeError('tenantId and studentId are required');

  const safeQuestions = Array.isArray(questions) ? questions : [];
  const safeAnswers = Array.isArray(answers) ? answers : [];
  const graded = gradeAssessmentQuestions(safeQuestions, safeAnswers);
  const evidence = aggregateSkillEvidence(graded);
  const updated = [];
  const topicMastery = [];
  let attempt = null;

  if (assessmentId) {
    const correctAnswers = graded.filter(item => item.correct).length;
    const totalQuestions = safeQuestions.length;
    const score = totalQuestions ? Math.round((correctAnswers / totalQuestions) * 10000) / 100 : 0;
    const attemptResult = await db.query(
      `INSERT INTO assessment_attempts
        (tenant_id,assessment_id,student_id,lesson_id,score,correct_answers,total_questions,answers)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
       RETURNING id,assessment_id,student_id,lesson_id,score,correct_answers,total_questions,submitted_at`,
      [tenantId, assessmentId, studentId, lessonId, score, correctAnswers, totalQuestions, JSON.stringify(safeAnswers.slice(0, safeQuestions.length))],
    );
    attempt = attemptResult.rows[0] || null;
  }

  for (const item of evidence) {
    const existing = await db.query(
      'SELECT mastery, attempts, confidence FROM skill_mastery WHERE tenant_id=$1 AND student_id=$2 AND skill=$3 LIMIT 1',
      [tenantId, studentId, item.skill],
    );
    const row = existing.rows[0] || { mastery: 0, attempts: 0, confidence: 50 };
    const previous = Number(row.mastery) || 0;
    const confidence = clamp(Number(row.confidence) || 50);
    const nextMastery = masteryUpdate(previous, item.score, item.difficulty / 100, confidence / 100);
    const nextAttempts = (Number(row.attempts) || 0) + item.attempts;

    const result = await db.query(
      `INSERT INTO skill_mastery
        (tenant_id, student_id, skill, mastery, attempts, last_score, last_difficulty, confidence, last_lesson_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT(student_id, skill) DO UPDATE SET
         mastery=EXCLUDED.mastery,
         attempts=EXCLUDED.attempts,
         last_score=EXCLUDED.last_score,
         last_difficulty=EXCLUDED.last_difficulty,
         confidence=EXCLUDED.confidence,
         last_lesson_id=EXCLUDED.last_lesson_id
       RETURNING skill, mastery, attempts, last_score, last_difficulty, confidence, last_lesson_id`,
      [tenantId, studentId, item.skill, nextMastery, nextAttempts, item.score, item.difficulty, confidence, lessonId],
    );
    updated.push(result.rows[0]);

    if (assessmentId) {
      await db.query(
        `INSERT INTO assessment_evidence
          (tenant_id,student_id,assessment_id,lesson_id,subject,topic,score,attempts,difficulty)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [tenantId, studentId, assessmentId, lessonId, String(subject || 'General').slice(0, 160), item.skill, item.score, item.attempts, item.difficulty],
      );
    }

    const topicResult = await db.query(
      `INSERT INTO topic_mastery
        (tenant_id,student_id,subject,topic,mastery,evidence_count)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT(student_id,subject,topic) DO UPDATE SET
         mastery=ROUND((topic_mastery.mastery*0.7+EXCLUDED.mastery*0.3)::numeric,2),
         evidence_count=topic_mastery.evidence_count+EXCLUDED.evidence_count,
         updated_at=now()
       RETURNING id,subject,topic,mastery,evidence_count,updated_at`,
      [tenantId, studentId, String(subject || 'General').slice(0, 160), item.skill, item.score, item.attempts],
    );
    topicMastery.push(topicResult.rows[0]);
  }

  const profile = buildKnowledgeProfile(updated.map(row => ({
    skill: row.skill,
    score: row.last_score,
    difficulty: Number(row.last_difficulty) / 100,
    confidence: Number(row.confidence) / 100,
  })));

  return {
    attempt,
    graded,
    evidence,
    updated,
    topicMastery,
    profile,
    weakSkills: profile.filter(item => item.weak).map(item => item.skill),
    nextDifficulty: profile.length ? rankNextQuestions([], profile) : [],
    recommendations: recommendNextStep(profile, [], 3),
  };
}

module.exports = {
  normalizeQuestionSkill,
  normalizeDifficulty,
  gradeAssessmentQuestions,
  aggregateSkillEvidence,
  applyAssessmentResult,
};
