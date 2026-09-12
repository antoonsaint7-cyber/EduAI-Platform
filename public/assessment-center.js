(() => {
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const api = async (url, options = {}) => {
    const response = await fetch(url, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'تعذر تنفيذ العملية.');
    return data;
  };

  async function loadRecommendations(root, courseId = '') {
    const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : '';
    const data = await api(`/api/learning/next${query}`);
    const weak = data.weak_topics || [];
    const recommendations = data.recommendations || [];
    root.innerHTML = `
      <section class="panel assessment-panel">
        <h2>🧠 التعلم التكيفي</h2>
        <p>${weak.length ? `لديك ${weak.length} موضوعات تحتاج مراجعة.` : 'لا توجد نقاط ضعف مسجلة بعد.'}</p>
        <div class="assessment-grid">
          ${recommendations.map((item) => `<article class="list-card stacked"><strong>${escapeHtml(item.lesson.title)}</strong><span>${escapeHtml(item.lesson.subject || '')} · ${escapeHtml(item.lesson.level || '')}</span><small>${escapeHtml(item.reason || 'مراجعة عامة')} · الأولوية: ${item.priority_level === 'critical' ? 'حرجة' : item.priority_level === 'high' ? 'مرتفعة' : 'عادية'}</small><button type="button" data-lesson="${escapeHtml(item.lesson.id)}">فتح الدرس</button></article>`).join('') || '<p>لا توجد توصيات حاليًا.</p>'}
        </div>
      </section>`;

    root.querySelectorAll('[data-lesson]').forEach((button) => button.addEventListener('click', () => {
      const item = recommendations.find((entry) => String(entry.lesson?.id) === String(button.dataset.lesson));
      if (!item?.lesson) return;
      localStorage.setItem('eduai-tutor-context', JSON.stringify({
        lessonId: item.lesson.id,
        title: item.lesson.title,
        subject: item.lesson.subject,
        level: item.lesson.level,
        content: String(item.lesson.content || '').slice(0, 12000),
        topic: item.topic || null,
        reason: item.reason || null,
      }));
      window.location.href = '/index.html';
    }));
  }

  window.EduAIAssessmentCenter = { loadRecommendations };
})();
