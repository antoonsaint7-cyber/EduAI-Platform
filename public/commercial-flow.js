'use strict';

(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
  const api = async (url, options = {}) => {
    const headers = options.body ? { 'Content-Type': 'application/json', ...(options.headers || {}) } : { ...(options.headers || {}) };
    const response = await fetch(url, { credentials: 'same-origin', ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || 'حدث خطأ غير متوقع.');
    return data;
  };

  async function attachLessonContext() {
    const container = document.getElementById('studentLessons');
    if (!container) return;
    try {
      const { lessons = [] } = await api('/api/lessons');
      const byKey = new Map(lessons.map(l => [`${l.title}|${l.subject}|${l.level}`, l]));
      container.querySelectorAll('.list-card.stacked').forEach(card => {
        const title = card.querySelector('h4')?.textContent?.trim() || '';
        const meta = card.querySelector('p')?.textContent?.trim() || '';
        const [subject = '', level = ''] = meta.split('•').map(v => v.trim());
        const lesson = byKey.get(`${title}|${subject}|${level}`) || lessons.find(l => l.title === title && l.subject === subject);
        if (lesson) {
          card.dataset.lessonId = lesson.id;
          if (lesson.course_id) card.dataset.courseId = lesson.course_id;
        }
      });
    } catch (_) { /* dashboard remains usable without the bridge */ }
  }

  function difficultyLabel(mastery) {
    const value = Number(mastery);
    if (value < 40) return 'مبتدئ (30%)';
    if (value < 60) return 'متوسط (50%)';
    if (value < 80) return 'متقدم (70%)';
    return 'تحدٍ (80%)';
  }

  async function refreshAdaptivePanel() {
    const root = document.getElementById('adaptiveLearning');
    if (!root || document.getElementById('teacher')) return;
    try {
      const [next, mastery] = await Promise.all([api('/api/learning/next'), api('/api/learning/mastery')]);
      const weak = (next.weak_topics || []).slice(0, 5);
      const recommendations = (next.recommendations || []).slice(0, 3);
      const skills = (mastery.skills || []).slice(0, 5);
      root.innerHTML = `
        <div class="analytics-grid">
          <article class="stat"><span>نقاط تحتاج دعم</span><strong>${weak.length}</strong><small>حسب الـ Mastery</small></article>
          <article class="stat"><span>أفضل Mastery</span><strong>${skills.length ? Math.max(...skills.map(x => Number(x.mastery) || 0)) : 0}%</strong><small>من المهارات المسجلة</small></article>
          <article class="stat"><span>الصعوبة المقترحة</span><strong>${skills.length ? esc(difficultyLabel(Number(skills[0].mastery))) : '50%'}</strong><small>للتدريب التالي</small></article>
        </div>
        <div class="list-grid">
          ${weak.length ? weak.map(x => `<article class="list-card"><div><h4>${esc(x.topic)}</h4><p>${esc(x.subject)} • Mastery ${esc(x.mastery)}%</p></div><span class="badge">يحتاج مراجعة</span></article>`).join('') : '<div class="empty">لا توجد نقاط ضعف حرجة حاليًا. استمر في التقدم.</div>'}
        </div>
        <div class="list-grid">
          ${recommendations.length ? recommendations.map(r => `<article class="list-card"><div><h4>${esc(r.lesson?.title || 'درس مقترح')}</h4><p>${esc(r.reason)} • Mastery ${esc(r.mastery ?? '—')}%</p></div><div class="list-actions"><span class="badge">${esc(r.priority_level)}</span>${r.lesson?.id ? `<button class="primary small" data-open-recommended="${esc(r.lesson.id)}" data-course-id="${esc(r.lesson.course_id || '')}">ابدأ الدرس</button>` : ''}</div></article>`).join('') : '<div class="empty">لا توجد توصيات جديدة.</div>'}
        </div>`;
      root.querySelectorAll('[data-open-recommended]').forEach(button => button.addEventListener('click', () => {
        localStorage.setItem('eduai-tutor-context', JSON.stringify({ lessonId: button.dataset.openRecommended, courseId: button.dataset.courseId || '' }));
        location.href = '/index.html';
      }));
    } catch (error) {
      root.innerHTML = `<div class="adaptive-empty">تعذر تحميل المسار الذكي: ${esc(error.message)}</div>`;
    }
  }

  function observeQuizResult() {
    const result = document.getElementById('quizResult');
    if (!result) return;
    const observer = new MutationObserver(() => {
      if (!result.hidden) refreshAdaptivePanel();
    });
    observer.observe(result, { childList: true, subtree: true, attributes: true });
  }

  function addTeacherStudentAnalytics() {
    const teacher = document.getElementById('teacher');
    if (!teacher || document.getElementById('teacherStudentLookup')) return;
    const panel = document.createElement('article');
    panel.className = 'panel';
    panel.id = 'teacherStudentLookup';
    panel.innerHTML = `<div class="section-heading compact"><div><h3>👨‍🏫 ملف طالب</h3><p>اعرض الـ Mastery ونقاط الضعف ومحاولات الاختبار من داخل لوحة المدرس.</p></div></div><div class="inline-form"><input id="teacherStudentId" placeholder="Student UUID" maxlength="36"><button id="loadStudentAnalytics" class="primary">عرض التحليل</button></div><div id="teacherStudentAnalytics" class="result-box" hidden></div>`;
    teacher.appendChild(panel);
    document.getElementById('loadStudentAnalytics').onclick = async () => {
      const id = document.getElementById('teacherStudentId').value.trim();
      const target = document.getElementById('teacherStudentAnalytics');
      try {
        const data = await api(`/api/analytics/teacher/student/${encodeURIComponent(id)}`);
        target.hidden = false;
        target.innerHTML = `<h4>${esc(data.student.name)} • ${esc(data.student.email)}</h4><p>متوسط Mastery: <strong>${esc(data.summary.average_mastery)}%</strong> • أفضل درجة: <strong>${esc(data.summary.best_score)}%</strong> • المحاولات: <strong>${esc(data.summary.attempts)}</strong></p><p>${(data.weak_topics || []).slice(0, 5).map(x => `<span class="badge">${esc(x.topic)} ${esc(x.mastery)}%</span>`).join(' ') || 'لا توجد نقاط ضعف مسجلة.'}</p>`;
      } catch (error) { target.hidden = false; target.textContent = error.message; }
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { attachLessonContext(); refreshAdaptivePanel(); observeQuizResult(); addTeacherStudentAnalytics(); }, 250);
    const lessons = document.getElementById('studentLessons');
    if (lessons) new MutationObserver(() => attachLessonContext()).observe(lessons, { childList: true, subtree: true });
  });
})();
