'use strict';

function clamp(n, min = 0, max = 100) { return Math.min(max, Math.max(min, Number.isFinite(Number(n)) ? Number(n) : 0)); }
function masteryUpdate(previous, score, difficulty = 0.5, confidence = 0.5) {
  const p = clamp(previous), s = clamp(score), d = clamp(difficulty * 100), c = clamp(confidence * 100);
  const weight = 0.2 + (d / 100) * 0.2 + (c / 100) * 0.1;
  return Math.round((p * (1 - weight) + s * weight) * 100) / 100;
}
function classify(score) { const s = clamp(score); return s < 50 ? 'needs_support' : s < 75 ? 'developing' : s < 90 ? 'proficient' : 'mastered'; }
function buildKnowledgeProfile(records = []) {
  const map = new Map();
  for (const r of Array.isArray(records) ? records : []) {
    if (!r?.skill) continue;
    const current = map.get(r.skill) || { skill: r.skill, mastery: 0, attempts: 0, last_score: 0, prerequisites: [] };
    current.mastery = masteryUpdate(current.mastery, r.score, r.difficulty, r.confidence);
    current.attempts += 1; current.last_score = clamp(r.score);
    if (Array.isArray(r.prerequisites)) current.prerequisites = [...new Set([...current.prerequisites, ...r.prerequisites])];
    map.set(r.skill, current);
  }
  return [...map.values()].map(x => ({ ...x, level: classify(x.mastery), weak: x.mastery < 70 }));
}
function rankNextQuestions(questions = [], profile = []) {
  const bySkill = new Map(profile.map(x => [x.skill, x]));
  return (Array.isArray(questions) ? questions : []).map(q => {
    const p = bySkill.get(q.skill);
    const mastery = p?.mastery ?? 0;
    const difficulty = clamp(q.difficulty ?? 50);
    const target = 45 + mastery * 0.45;
    const fit = 100 - Math.abs(difficulty - target);
    const weakness = p ? 100 - mastery : 0;
    const knownSkillBonus = p ? 8 : 0;
    return { ...q, adaptive_score: Math.round((fit * 0.3 + weakness * 0.7 + knownSkillBonus) * 100) / 100 };
  }).sort((a, b) => b.adaptive_score - a.adaptive_score);
}
function buildDynamicPath(profile = [], max = 8) {
  return [...profile].filter(x => x.mastery < 90).sort((a, b) => a.mastery - b.mastery).slice(0, max).map((x, i) => ({ order: i + 1, skill: x.skill, mastery: x.mastery, action: x.mastery < 50 ? 'reteach' : 'practice', level: classify(x.mastery) }));
}
module.exports = { clamp, masteryUpdate, classify, buildKnowledgeProfile, rankNextQuestions, buildDynamicPath };
