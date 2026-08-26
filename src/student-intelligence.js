function clamp(value, min = 0, max = 1) { return Math.max(min, Math.min(max, Number(value) || 0)); }

function calculateMastery({ correct = 0, total = 0, difficulty = 0.5, recency = 1, attempts = 1 } = {}) {
  const accuracy = total > 0 ? correct / total : 0;
  const difficultyFactor = 0.75 + clamp(difficulty) * 0.5;
  const recencyFactor = 0.7 + clamp(recency) * 0.3;
  const attemptFactor = Math.min(1.1, 0.85 + Math.log2(Math.max(1, attempts)) * 0.08);
  return Math.round(clamp(accuracy * difficultyFactor * recencyFactor * attemptFactor) * 100);
}

function buildKnowledgeProfile(skills = []) {
  return skills.map(skill => ({ id: skill.id, name: skill.name, mastery: Math.round(clamp(skill.mastery, 0, 100)), status: skill.mastery < 50 ? 'weak' : skill.mastery < 75 ? 'developing' : 'mastered' }));
}

function selectNextQuestion(questions, profile) {
  if (!Array.isArray(questions) || !questions.length) return null;
  const mastery = new Map((profile || []).map(s => [s.id, Number(s.mastery) || 0]));
  return [...questions].sort((a, b) => {
    const am = mastery.get(a.skill_id) ?? 50; const bm = mastery.get(b.skill_id) ?? 50;
    return (am - bm) || (Number(a.difficulty) - Number(b.difficulty));
  })[0];
}

function buildLearningPath(profile = []) {
  return profile.filter(s => s.mastery < 80).sort((a, b) => a.mastery - b.mastery).map((s, i) => ({ order: i + 1, skill_id: s.id, action: s.mastery < 50 ? 'review_and_practice' : 'targeted_practice' }));
}

module.exports = { clamp, calculateMastery, buildKnowledgeProfile, selectNextQuestion, buildLearningPath };
