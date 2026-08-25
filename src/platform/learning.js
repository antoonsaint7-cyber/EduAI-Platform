const clamp = (n) => Math.max(0, Math.min(1, Number(n) || 0));

function updateMastery(current, { correct, difficulty = 'medium', responseMs = 0 }) {
  const weight = difficulty === 'hard' ? 0.16 : difficulty === 'easy' ? 0.08 : 0.12;
  const signal = correct ? 1 : 0;
  const latencyPenalty = responseMs > 120000 ? 0.05 : 0;
  return clamp(current + weight * (signal - current) - latencyPenalty);
}

function nextDifficulty(mastery) {
  if (mastery < 0.45) return 'easy';
  if (mastery < 0.75) return 'medium';
  return 'hard';
}

function nextReviewAt(mastery, now = new Date()) {
  const days = mastery < 0.45 ? 1 : mastery < 0.7 ? 3 : mastery < 0.85 ? 7 : 14;
  const date = new Date(now); date.setUTCDate(date.getUTCDate() + days); return date.toISOString();
}

module.exports = { updateMastery, nextDifficulty, nextReviewAt };
