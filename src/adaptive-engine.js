'use strict';

function clamp(n, min = 0, max = 100) { return Math.min(max, Math.max(min, Number.isFinite(Number(n)) ? Number(n) : 0)); }

function masteryUpdate(previous, score, difficulty = 0.5, confidence = 0.5) {
  const p = clamp(previous); const s = clamp(score);
  const d = clamp(difficulty * 100); const c = clamp(confidence * 100);
  const weight = 0.2 + (d / 100) * 0.2 + (c / 100) * 0.1;
  return Math.round((p * (1 - weight) + s * weight) * 100) / 100;
}

function classify(score) {
  const s = clamp(score);
  return s < 50 ? 'needs_support' : s < 75 ? 'developing' : s < 90 ? 'proficient' : 'mastered';
}

function buildKnowledgeProfile(records = []) {
  const map = new Map();
  for (const r of Array.isArray(records) ? records : []) {
    if (!r?.skill) continue;
    const current = map.get(r.skill) || { skill: r.skill, mastery: 0, attempts: 0, last_score: 0, prerequisites: [] };
    current.mastery = masteryUpdate(current.mastery, r.score, r.difficulty, r.confidence);
    current.attempts += 1;
    current.last_score = clamp(r.score);
    if (Array.isArray(r.prerequisites)) current.prerequisites = [...new Set([...current.prerequisites, ...r.prerequisites])];
    map.set(r.skill, current);
  }
  return [...map.values()].map(x => ({ ...x, level: classify(x.mastery), weak: x.mastery < 70 }));
}

function targetDifficulty(mastery) {
  const m = clamp(mastery);
  if (m < 50) return 30;
  if (m < 70) return 45;
  if (m < 85) return 60;
  return 75;
}

function rankNextQuestions(questions = [], profile = []) {
  const bySkill = new Map(profile.map(x => [x.skill, x]));
  return (Array.isArray(questions) ? questions : []).map(q => {
    const p = bySkill.get(q.skill); const mastery = p?.mastery ?? 0;
    const difficulty = clamp(q.difficulty ?? 50); const target = targetDifficulty(mastery);
    const fit = 100 - Math.abs(difficulty - target);
    const weakness = 100 - mastery;
    const knownSkillBonus = p ? 10 : -30;
    return { ...q, adaptive_score: Math.round((fit * 0.3 + weakness * 0.7 + knownSkillBonus) * 100) / 100, recommended_difficulty: target };
  }).sort((a, b) => b.adaptive_score - a.adaptive_score);
}

function buildDynamicPath(profile = [], max = 8) {
  return [...profile]
    .filter(x => x.mastery < 90)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, Math.max(1, max))
    .map((x, i) => ({ order: i + 1, skill: x.skill, mastery: x.mastery, action: x.mastery < 50 ? 'reteach' : 'practice', level: classify(x.mastery), target_difficulty: targetDifficulty(x.mastery) }));
}

function recommendNextStep(profile = [], lessons = [], max = 3) {
  const path = buildDynamicPath(profile, max);
  return path.map(step => {
    const lesson = (Array.isArray(lessons) ? lessons : []).find(l => l.skill === step.skill || l.title === step.skill || l.topic === step.skill);
    return { ...step, lesson_id: lesson?.id ?? null, lesson_title: lesson?.title ?? null };
  });
}

module.exports = { clamp, masteryUpdate, classify, buildKnowledgeProfile, targetDifficulty, rankNextQuestions, buildDynamicPath, recommendNextStep };
