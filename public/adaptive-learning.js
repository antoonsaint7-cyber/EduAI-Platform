(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[ch]));
  const clamp = value => Math.max(0, Math.min(100, Number(value) || 0));
  const state = mastery => mastery < 60 ? ['يحتاج دعمًا', 'adaptive-weak'] : mastery < 80 ? ['قيد التحسن', 'adaptive-improving'] : ['متقن', 'adaptive-mastered'];

  async function json(url) {
    const response = await fetch(url, { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json();
  }

  async function render() {
    const root = document.getElementById('adaptiveLearning');
    const student = document.getElementById('student');
    if (!root || !student || student.hidden) return;
    try {
      const [{ progress }, { lessons }] = await Promise.all([json('/api/progress'), json('/api/lessons')]);
      const ranked = (progress || []).map(item => ({ ...item, mastery: clamp(item.mastery) })).sort((a, b) => a.mastery - b.mastery);
      const weak = ranked.filter(item => item.mastery < 60);
      const improving = ranked.filter(item => item.mastery >= 60 && item.mastery < 80);
      const recommendations = (weak.length ? weak : improving).slice(0, 3);
      const lessonById = new Map((lessons || []).map(lesson => [String(lesson.id), lesson]));
      const cards = recommendations.map(item => {
        const lesson = lessonById.get(String(item.lesson_id)) || (lessons || []).find(l => l.title === item.title);
        const [label, css] = state(item.mastery);
        return `<article class="adaptive-card"><div><h4>${esc(item.title || lesson?.title || 'مهارة تحتاج إلى تطوير')}</h4><p>${esc(item.subject || lesson?.subject || 'مادة تعليمية')} • الإتقان ${item.mastery}%</p></div><div class="adaptive-actions"><span class="adaptive-level ${css}">${label}</span>${lesson ? `<button type="button" class="primary small" data-adaptive-lesson="${esc(lesson.id)}">ابدأ الدرس</button>` : ''}</div></article>`;
      }).join('');
      const summary = weak.length ? `لدينا ${weak.length} مهارة تحتاج دعمًا، فسنبدأ بالأضعف.` : improving.length ? 'مستواك يتحسن. هذه الخطوات تساعدك على الوصول إلى الإتقان.' : 'أكمل اختبارًا واحدًا على الأقل لبناء توصيات شخصية.';
      root.innerHTML = `<div class="adaptive-summary"><span class="adaptive-chip">🎯 توصيات شخصية</span><span class="adaptive-chip">${esc(summary)}</span></div><div class="adaptive-list">${cards || '<div class="adaptive-empty">لا توجد توصيات كافية بعد.</div>'}</div>`;
      root.querySelectorAll('[data-adaptive-lesson]').forEach(button => button.addEventListener('click', () => {
        const lesson = document.querySelector('#studentLessons h4') && [...document.querySelectorAll('#studentLessons article')].find(card => card.querySelector('h4')?.textContent === lessonById.get(String(button.dataset.adaptiveLesson))?.title);
        lesson?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        lesson?.querySelector('details')?.setAttribute('open', '');
      }));
    } catch (error) {
      root.innerHTML = '<div class="adaptive-empty">تعذر تحميل المسار الذكي حاليًا.</div>';
      console.error('Adaptive learning:', error);
    }
  }

  const progress = document.getElementById('progress');
  if (progress) new MutationObserver(() => render()).observe(progress, { childList: true, subtree: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  setTimeout(render, 500);
})();
