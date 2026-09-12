'use strict';

function registerRagScope(app, { query, getCurrentUser }) {
  const authTeacher = async (req, res, next) => {
    try {
      req.user = await getCurrentUser(req);
      if (!req.user) return res.status(401).json({ error: 'تسجيل الدخول مطلوب.' });
      if (!['teacher', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'ليس لديك صلاحية.' });
      return next();
    } catch (error) { return next(error); }
  };

  app.patch('/api/rag/documents/:id/scope', authTeacher, async (req, res, next) => {
    try {
      const documentId = String(req.params.id || '').trim();
      const courseId = req.body?.courseId ? String(req.body.courseId).trim() : null;
      const lessonId = req.body?.lessonId ? String(req.body.lessonId).trim() : null;
      if (!/^[0-9a-f-]{36}$/i.test(documentId)) return res.status(400).json({ error: 'documentId غير صحيح.' });
      if (courseId && !/^[0-9a-f-]{36}$/i.test(courseId)) return res.status(400).json({ error: 'courseId غير صحيح.' });
      if (lessonId && !/^[0-9a-f-]{36}$/i.test(lessonId)) return res.status(400).json({ error: 'lessonId غير صحيح.' });
      if (lessonId && !courseId) return res.status(400).json({ error: 'lessonId يحتاج courseId.' });

      if (courseId) {
        const course = await query(`SELECT id FROM courses WHERE id=$1 AND tenant_id=$2 AND ($3='admin' OR created_by=$4) LIMIT 1`, [courseId, req.user.tenant_id, req.user.role, req.user.id]);
        if (!course.rows[0]) return res.status(404).json({ error: 'الكورس غير موجود أو ليس من اختصاصك.' });
      }
      if (lessonId) {
        const lesson = await query(`SELECT id FROM lessons WHERE id=$1 AND tenant_id=$2 AND course_id=$3 AND ($4='admin' OR created_by=$5) LIMIT 1`, [lessonId, req.user.tenant_id, courseId, req.user.role, req.user.id]);
        if (!lesson.rows[0]) return res.status(404).json({ error: 'الدرس غير موجود أو لا ينتمي للكورس.' });
      }

      const result = await query(`UPDATE documents SET course_id=$1, lesson_id=$2 WHERE id=$3 AND tenant_id=$4 RETURNING id,name,mime_type,size_bytes,course_id,lesson_id,created_at`, [courseId, lessonId, documentId, req.user.tenant_id]);
      if (!result.rows[0]) return res.status(404).json({ error: 'المستند غير موجود.' });
      res.json({ document: result.rows[0] });
    } catch (error) { next(error); }
  });
}

module.exports = { registerRagScope };
