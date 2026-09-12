'use strict';

function registerLearningApi(app, { query, getCurrentUser, client = null }) {
  const auth = async (req, res, next) => {
    try {
      req.user = await getCurrentUser(req);
      if (!req.user) return res.status(401).json({ error: 'تسجيل الدخول مطلوب.' });
      return next();
    } catch (error) { return next(error); }
  };
  const role = (...roles) => async (req, res, next) => {
    await auth(req, res, async () => roles.includes(req.user.role)
      ? next()
      : res.status(403).json({ error: 'ليس لديك صلاحية.' }));
  };

  app.get('/api/learning/next', role('student'), async (req, res, next) => {
    try {
      const courseId = req.query.courseId ? String(req.query.courseId) : null;
      if (courseId && !/^[0-9a-f-]{36}$/i.test(courseId)) return res.status(400).json({ error: 'courseId غير صحيح.' });

      const mastery = await query(
        `SELECT subject,topic,mastery,evidence_count,updated_at
         FROM topic_mastery
         WHERE tenant_id=$1 AND student_id=$2
         ORDER BY mastery ASC, updated_at ASC`,
        [req.user.tenant_id, req.user.id],
      );
      const weak = mastery.rows.filter(row => Number(row.mastery) < 90).slice(0, 8);

      const lessons = await query(
        `SELECT l.id,l.title,l.subject,l.level,l.content,l.course_id,l.position,
                c.title AS course_title
         FROM lessons l
         LEFT JOIN courses c ON c.id=l.course_id
         WHERE l.tenant_id=$1
           AND l.status='published'
           AND ($3::uuid IS NULL OR l.course_id=$3::uuid OR l.course_id IS NULL)
           AND (
             l.course_id IS NULL OR EXISTS (
               SELECT 1 FROM course_memberships cm
               WHERE cm.course_id=l.course_id
                 AND cm.student_id=$2
                 AND cm.status IN ('active','completed')
             )
           )
         ORDER BY l.updated_at DESC
         LIMIT 100`,
        [req.user.tenant_id, req.user.id, courseId],
      );

      const recommendations = lessons.rows.map(lesson => {
        const related = weak
          .filter(topic => topic.subject === lesson.subject && lesson.content.toLowerCase().includes(String(topic.topic).toLowerCase()))
          .sort((a, b) => Number(a.mastery) - Number(b.mastery));
        const weakest = related[0] || null;
        const deficit = weakest ? 100 - Number(weakest.mastery) : 0;
        return {
          lesson,
          priority: weakest ? Math.round(deficit * 100) / 100 : 0,
          priority_level: weakest && Number(weakest.mastery) < 50 ? 'critical' : weakest ? 'high' : 'normal',
          reason: weakest ? `يستهدف نقطة الضعف: ${weakest.topic}` : 'مراجعة عامة',
          topic: weakest?.topic || null,
          mastery: weakest ? Number(weakest.mastery) : null,
        };
      }).sort((a, b) => b.priority - a.priority || a.lesson.position - b.lesson.position).slice(0, 10);

      res.json({ weak_topics: weak, recommendations });
    } catch (error) { next(error); }
  });

  app.get('/api/assessments/history', role('student'), async (req, res, next) => {
    try {
      const result = await query(
        `SELECT aa.id,aa.assessment_id,aa.lesson_id,aa.score,aa.correct_answers,aa.total_questions,
                aa.answers,aa.submitted_at,l.title AS lesson_title,l.subject,l.level
         FROM assessment_attempts aa
         JOIN assessments a ON a.id=aa.assessment_id
         JOIN lessons l ON l.id=aa.lesson_id
         WHERE aa.tenant_id=$1 AND aa.student_id=$2
         ORDER BY aa.submitted_at DESC
         LIMIT 50`,
        [req.user.tenant_id, req.user.id],
      );
      res.json({ attempts: result.rows });
    } catch (error) { next(error); }
  });

  app.get('/api/learning/mastery', role('student'), async (req, res, next) => {
    try {
      const [topics, skills] = await Promise.all([
        query(`SELECT subject,topic,mastery,evidence_count,updated_at FROM topic_mastery WHERE tenant_id=$1 AND student_id=$2 ORDER BY mastery ASC`, [req.user.tenant_id, req.user.id]),
        query(`SELECT skill,mastery,attempts,last_score,last_difficulty,confidence,last_lesson_id FROM skill_mastery WHERE tenant_id=$1 AND student_id=$2 ORDER BY mastery ASC`, [req.user.tenant_id, req.user.id]),
      ]);
      res.json({ topics: topics.rows, skills: skills.rows });
    } catch (error) { next(error); }
  });

  app.get('/api/analytics/teacher/student/:studentId', role('teacher'), async (req, res, next) => {
    try {
      const studentId = String(req.params.studentId || '');
      if (!/^[0-9a-f-]{36}$/i.test(studentId)) return res.status(400).json({ error: 'studentId غير صحيح.' });
      const student = await query(`SELECT id,name,email FROM users WHERE id=$1 AND tenant_id=$2 AND role='student'`, [studentId, req.user.tenant_id]);
      if (!student.rows[0]) return res.status(404).json({ error: 'الطالب غير موجود.' });
      const [summary, topics, attempts] = await Promise.all([
        query(`SELECT COUNT(*)::int AS lessons_attempted,COALESCE(ROUND(AVG(mastery)::numeric,1),0) AS average_mastery,COALESCE(MAX(last_score),0) AS best_score,COALESCE(SUM(attempts),0)::int AS attempts FROM progress WHERE tenant_id=$1 AND student_id=$2`, [req.user.tenant_id, studentId]),
        query(`SELECT subject,topic,mastery,evidence_count,updated_at FROM topic_mastery WHERE tenant_id=$1 AND student_id=$2 ORDER BY mastery ASC LIMIT 20`, [req.user.tenant_id, studentId]),
        query(`SELECT score,correct_answers,total_questions,submitted_at,l.title AS lesson_title FROM assessment_attempts aa JOIN lessons l ON l.id=aa.lesson_id WHERE aa.tenant_id=$1 AND aa.student_id=$2 ORDER BY submitted_at DESC LIMIT 20`, [req.user.tenant_id, studentId]),
      ]);
      res.json({ student: student.rows[0], summary: summary.rows[0], weak_topics: topics.rows.filter(row => Number(row.mastery) < 70), topics: topics.rows, attempts: attempts.rows });
    } catch (error) { next(error); }
  });
}

module.exports = { registerLearningApi };
