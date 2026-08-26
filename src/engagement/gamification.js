export const LEVEL_BASE_XP = 100;
export const LEVEL_XP_STEP = 50;

export function levelFromXp(xp = 0) {
  const safeXp = Math.max(0, Number(xp) || 0);
  let level = 1;
  let required = LEVEL_BASE_XP;
  let remaining = safeXp;
  while (remaining >= required) {
    remaining -= required;
    level += 1;
    required += LEVEL_XP_STEP;
  }
  return level;
}

export const BADGES = Object.freeze([
  { id: 'first-quiz', name: 'First Quiz', condition: (s) => s.quizzesCompleted >= 1 },
  { id: 'quiz-streak', name: 'Quiz Streak', condition: (s) => s.quizStreak >= 3 },
  { id: 'mastery-50', name: 'Halfway Mastery', condition: (s) => s.masteryAverage >= 50 },
  { id: 'mastery-80', name: 'Mastery', condition: (s) => s.masteryAverage >= 80 },
  { id: 'lesson-10', name: 'Dedicated Learner', condition: (s) => s.lessonsCompleted >= 10 }
]);

export function calculateGamificationState(input = {}) {
  const xp = Math.max(0, Number(input.xp) || 0);
  const level = levelFromXp(xp);
  const stats = {
    quizzesCompleted: Math.max(0, Number(input.quizzesCompleted) || 0),
    quizStreak: Math.max(0, Number(input.quizStreak) || 0),
    masteryAverage: Math.max(0, Math.min(100, Number(input.masteryAverage) || 0)),
    lessonsCompleted: Math.max(0, Number(input.lessonsCompleted) || 0)
  };
  return { xp, level, badges: BADGES.filter((badge) => badge.condition(stats)).map(({ id, name }) => ({ id, name })) };
}
