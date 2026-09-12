const DEMO_LESSONS = [
  {
    id: 'demo-lesson-fractions',
    title: 'Understanding Fractions',
    subject: 'Mathematics',
    level: 'Grade 6',
    content: 'A fraction represents part of a whole. The numerator is the top number and the denominator is the bottom number. Equivalent fractions have the same value, such as 1/2 and 2/4.',
  },
  {
    id: 'demo-lesson-photosynthesis',
    title: 'Photosynthesis Basics',
    subject: 'Science',
    level: 'Grade 7',
    content: 'Photosynthesis is the process plants use to make food from light energy, carbon dioxide, and water. Oxygen is released as a by-product.',
  },
  {
    id: 'demo-lesson-ancient-egypt',
    title: 'Ancient Egypt',
    subject: 'History',
    level: 'Grade 7',
    content: 'Ancient Egyptian civilization developed along the Nile River. Agriculture, writing, architecture, and centralized government were important parts of Egyptian society.',
  },
];

const DEMO_PROGRESS = {
  completedLessons: 2,
  totalLessons: 3,
  mastery: [
    { subject: 'Mathematics', topic: 'Fractions', mastery: 62 },
    { subject: 'Science', topic: 'Photosynthesis', mastery: 84 },
    { subject: 'History', topic: 'Ancient Egypt', mastery: 71 },
  ],
  recentAssessment: { title: 'Math Fundamentals', score: 78, correct: 7, total: 9 },
};

function answerFor(message) {
  const text = String(message || '').toLowerCase();
  if (/fraction|fractions|كسر|كسور/.test(text)) {
    return {
      answer: 'A fraction shows a part of a whole. The numerator is on top and the denominator is on the bottom. For example, 2/4 is equivalent to 1/2 because both represent the same value.',
      sources: [{ lessonId: DEMO_LESSONS[0].id, title: DEMO_LESSONS[0].title }],
    };
  }
  if (/photo|photosynthesis|تمثيل ضوئي|البناء الضوئي/.test(text)) {
    return {
      answer: 'Photosynthesis lets plants make food using light energy, carbon dioxide, and water. Oxygen is released as a by-product.',
      sources: [{ lessonId: DEMO_LESSONS[1].id, title: DEMO_LESSONS[1].title }],
    };
  }
  if (/egypt|nile|مصر|النيل|فرعون/.test(text)) {
    return {
      answer: 'Ancient Egyptian civilization developed along the Nile. The river supported agriculture and helped cities, trade, writing, and centralized government grow.',
      sources: [{ lessonId: DEMO_LESSONS[2].id, title: DEMO_LESSONS[2].title }],
    };
  }
  return {
    answer: 'Demo Tutor can answer questions grounded in the sample lessons. Try asking about fractions, photosynthesis, or Ancient Egypt.',
    sources: [],
  };
}

function registerDemoMode(app) {
  app.get('/api/demo/status', (_req, res) => {
    res.json({
      enabled: true,
      provider: 'demo',
      ai_cost: 0,
      message: 'EduAI zero-cost demo mode is active. No external AI API is required.',
    });
  });

  app.get('/api/demo/overview', (_req, res) => {
    res.json({
      demo: true,
      teacher: { name: 'Demo Teacher', courses: 1, students: 12 },
      student: { name: 'Demo Student', course: 'AI Learning Fundamentals' },
      course: {
        id: 'demo-course',
        title: 'AI Learning Fundamentals',
        subject: 'Mixed Subjects',
        level: 'Grade 6-7',
        status: 'published',
        lessons: DEMO_LESSONS,
      },
      progress: DEMO_PROGRESS,
      next: {
        priority: 'high',
        topic: 'Fractions',
        mastery: 62,
        reason: 'Low mastery detected. Review the lesson before the next assessment.',
      },
    });
  });

  app.post('/api/demo/chat', (req, res) => {
    const message = String(req.body?.message || '').trim();
    if (!message || message.length > 2000) return res.status(400).json({ error: 'A message is required.' });
    const result = answerFor(message);
    res.json({ demo: true, provider: 'demo', ...result });
  });

  app.get('/demo', (_req, res) => res.redirect('/demo.html'));
}

module.exports = { registerDemoMode, DEMO_LESSONS };
