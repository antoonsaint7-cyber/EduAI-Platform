function attachTutorContextActions() {
  document.querySelectorAll('#studentLessons .list-card.stacked').forEach(card => {
    if (card.querySelector('[data-ask-tutor]')) return;
    const title = card.querySelector('h4')?.textContent?.trim() || 'الدرس الحالي';
    const meta = card.querySelector('p')?.textContent?.trim() || '';
    const [subject = '', level = ''] = meta.split('•').map(value => value.trim());
    const content = card.querySelector('.lesson-body')?.textContent?.trim() || '';
    const lessonId = card.dataset.lessonId || card.dataset.id || '';
    const courseId = card.dataset.courseId || '';
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'primary small tutor-context-action';
    action.dataset.askTutor = 'true';
    action.textContent = '🧠 اسأل المساعد عن الدرس';
    action.addEventListener('click', () => {
      if (!content) return;
      localStorage.setItem('eduai-tutor-context', JSON.stringify({ title, subject, level, content, lessonId, courseId }));
      localStorage.removeItem('voice-ai-history');
      window.location.href = '/index.html';
    });
    card.appendChild(action);
  });
}

const tutorContextObserver = new MutationObserver(attachTutorContextActions);
tutorContextObserver.observe(document.body, { childList: true, subtree: true });
attachTutorContextActions();
