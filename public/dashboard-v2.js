const $ = id => document.getElementById(id);
const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
const api = async (url, options = {}) => {
  const headers = options.body ? { 'Content-Type': 'application/json', ...(options.headers || {}) } : { ...(options.headers || {}) };
  const response = await fetch(url, { credentials: 'same-origin', ...options, headers });
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || 'حدث خطأ غير متوقع.');
  return data;
};

let generatedCourse = null;
const statCard = (label, value, hint) => `<article class="stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(hint)}</small></article>`;

async function load() {
  try {
    const { user } = await api('/api/auth/me');
    $('identity').textContent = `${user.name} • ${user.role === 'teacher' ? 'مدرس' : 'طالب'}`;
    $('auth').hidden = true;
    $('app').hidden = false;
    $('teacher').hidden = user.role !== 'teacher';
    $('student').hidden = user.role !== 'student';
    if (user.role === 'teacher') await loadTeacher(); else await loadStudent();
  } catch (_) {
    $('auth').hidden = false;
    $('app').hidden = true;
    $('identity').textContent = 'سجّل الدخول للمتابعة';
  }
}

$('login').onclick = async () => {
  try { $('authStatus').textContent = 'جارٍ تسجيل الدخول...'; await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: $('email').value, password: $('password').value }) }); await load(); }
  catch (error) { $('authStatus').textContent = error.message; }
};
$('logout').onclick = async () => { await api('/api/auth/logout', { method: 'POST' }); location.reload(); };
$('refreshTeacher').onclick = loadTeacher;
$('refreshStudent').onclick = loadStudent;

async function loadTeacher() {
  const [{ lessons: review }, { lessons: published }, analytics, assessments] = await Promise.all([
    api('/api/lessons?status=review'), api('/api/lessons?status=published'), api('/api/analytics/teacher'), api('/api/assessments'),
  ]);
  const lessons = [...review, ...published.filter(p => !review.some(r => r.id === p.id))];
  $('stats').innerHTML = [statCard('الدروس', analytics.lessons.total, `${analytics.lessons.published} منشور`), statCard('الطلاب', analytics.students.total, 'في مؤسستك'), statCard('متوسط الإتقان', `${analytics.mastery.average}%`, 'Mastery'), statCard('يحتاجون دعمًا', analytics.at_risk_students.total, 'إتقان أقل من 60%')].join('');
  renderTeacherLessons(lessons);
  renderTeacherAnalytics(analytics);
  renderTeacherAssessments(assessments.assessments, lessons);
}

function renderTeacherLessons(lessons) {
  $('teacherLessons').innerHTML = lessons.map(l => `<article class="list-card"><div><h4>${escapeHtml(l.title)}</h4><p>${escapeHtml(l.subject)} • ${escapeHtml(l.level)}</p></div><div class="list-actions"><span class="badge status-${escapeHtml(l.status)}">${escapeHtml(l.status)}</span>${l.status === 'review' ? `<button data-publish="${l.id}" class="primary small">نشر</button>` : ''}<button data-quiz="${l.id}" class="ghost small">توليد اختبار</button></div></article>`).join('') || '<div class="empty">لا توجد دروس بعد.</div>';
  document.querySelectorAll('[data-publish]').forEach(button => button.onclick = async () => { try { await api(`/api/lessons/${button.dataset.publish}/publish`, { method: 'POST' }); await loadTeacher(); } catch (e) { alert(e.message); } });
  document.querySelectorAll('[data-quiz]').forEach(button => button.onclick = () => generateQuiz(button.dataset.quiz));
}

function renderTeacherAnalytics(data) {
  $('teacherAnalytics').innerHTML = [statCard('دروس منشورة', data.lessons.published, 'متاحة للطلاب'), statCard('قيد المراجعة', data.lessons.review, 'تحتاج قرار المدرس'), statCard('متوسط المؤسسة', `${data.mastery.average}%`, 'Mastery'), statCard('طلاب يحتاجون تدخل', data.at_risk_students.total, 'أقل من 60%')].join('');
  $('subjectAnalytics').innerHTML = data.subjects.map(item => `<div class="subject-row"><span>${escapeHtml(item.subject || 'غير محدد')}</span><div class="meter"><i style="width:${Math.max(0, Math.min(100, Number(item.mastery) || 0))}%"></i></div><strong>${escapeHtml(item.mastery)}%</strong></div>`).join('') || '<div class="empty">ستظهر التحليلات بعد تسجيل نتائج الطلاب.</div>';
}

function renderTeacherAssessments(assessments, lessons) {
  $('teacherAssessments').innerHTML = assessments.map(a => { const q = Array.isArray(a.questions?.questions) ? a.questions.questions : []; return `<article class="list-card"><div><h4>${escapeHtml(a.title)}</h4><p>${escapeHtml(a.subject)} • ${new Date(a.created_at).toLocaleDateString('ar-EG')}</p></div><span class="badge">${q.length} سؤال</span></article>`; }).join('') || '<div class="empty">لا توجد اختبارات مولدة بعد.</div>';
  $('assessmentCreator').innerHTML = `<label>الدرس<select id="quizLesson">${lessons.map(l => `<option value="${l.id}">${escapeHtml(l.title)}</option>`).join('')}</select></label><label>عدد الأسئلة<select id="quizCount"><option>5</option><option selected>10</option><option>15</option></select></label><button id="generateQuizInline" class="primary">توليد اختبار</button>`;
  $('generateQuizInline').onclick = () => generateQuiz($('quizLesson').value);
}

async function generateQuiz(lessonId) {
  try { const data = await api('/api/ai/quiz-generate', { method: 'POST', body: JSON.stringify({ lessonId, questionCount: Number($('quizCount')?.value || 10) }) }); alert(`تم إنشاء اختبار: ${data.quiz.title || 'اختبار جديد'}`); await loadTeacher(); }
  catch (error) { alert(error.message); }
}

$('generateLesson').onclick = async () => {
  const button = $('generateLesson');
  try {
    button.disabled = true; button.textContent = 'جاري التوليد...';
    const { lesson } = await api('/api/ai/lesson-generate', { method: 'POST', body: JSON.stringify({ title: $('aiLessonTitle').value, subject: $('aiLessonSubject').value, level: $('aiLessonLevel').value, goals: $('aiLessonGoals').value, sourceText: $('aiLessonSource').value }) });
    $('lessonPreview').hidden = false;
    $('lessonPreview').innerHTML = `<h4>${escapeHtml(lesson.title)}</h4><p>${escapeHtml(lesson.summary || '')}</p><h5>أهداف التعلم</h5><ul>${(lesson.objectives || []).map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul><div class="preview-actions"><button id="saveGeneratedLesson" class="primary">حفظ كمسودة مراجعة</button></div>`;
    $('saveGeneratedLesson').onclick = async () => { await api('/api/lessons', { method: 'POST', body: JSON.stringify({ title: lesson.title, subject: $('aiLessonSubject').value, level: $('aiLessonLevel').value, content: renderLessonContent(lesson) }) }); await loadTeacher(); };
  } catch (error) { alert(error.message); }
  finally { button.disabled = false; button.textContent = 'توليد الدرس'; }
};

function renderLessonContent(l) { return [`${l.summary || ''}`, ...(l.objectives || []).map(x => `هدف تعلم: ${x}`), ...(l.sections || []).map(s => `${s.heading}\n${s.body}`), ...(l.examples || []).map(x => `مثال: ${x}`), ...(l.homework || []).map(x => `واجب: ${x}`)].filter(Boolean).join('\n\n'); }

$('generateCourse').onclick = async () => {
  const button = $('generateCourse');
  try {
    button.disabled = true; button.textContent = 'جاري بناء الخطة...';
    generatedCourse = (await api('/api/ai/course-generate', { method: 'POST', body: JSON.stringify({ title: $('courseTitle').value, subject: $('courseSubject').value, level: $('courseLevel').value, lessonCount: Number($('courseCount').value), sourceText: $('courseSource').value }) })).course;
    $('coursePreview').hidden = false;
    $('coursePreview').innerHTML = `<h4>${escapeHtml(generatedCourse.title)}</h4><p>${escapeHtml(generatedCourse.description || '')}</p><ul>${(generatedCourse.lessons || []).map((l, i) => `<li><strong>${i + 1}. ${escapeHtml(l.title)}</strong><span>${escapeHtml(l.objective || '')}</span></li>`).join('')}</ul><div class="preview-actions"><button id="saveGeneratedCourse" class="primary">حفظ الدروس كمسودات مراجعة</button></div>`;
    $('saveGeneratedCourse').onclick = saveGeneratedCourse;
  } catch (error) { alert(error.message); }
  finally { button.disabled = false; button.textContent = 'توليد الكورس'; }
};

async function saveGeneratedCourse() {
  if (!generatedCourse?.lessons?.length) return;
  for (const lesson of generatedCourse.lessons) await api('/api/lessons', { method: 'POST', body: JSON.stringify({ title: lesson.title, subject: $('courseSubject').value, level: $('courseLevel').value, content: `${lesson.objective || ''}\n\n${lesson.summary || ''}` }) });
  await loadTeacher();
  alert('تم حفظ دروس الكورس كمسودات للمراجعة والنشر.');
}

async function loadStudent() {
  const [{ lessons }, analytics, progressData, assessments] = await Promise.all([api('/api/lessons'), api('/api/analytics/student'), api('/api/progress'), api('/api/assessments')]);
  $('studentStats').innerHTML = [statCard('دروس بدأت', analytics.summary.lessons_attempted, 'محاولات على دروس'), statCard('متوسط الإتقان', `${analytics.summary.average_mastery}%`, 'Mastery'), statCard('أفضل درجة', `${analytics.summary.best_score}%`, 'أعلى نتيجة'), statCard('إجمالي المحاولات', analytics.summary.attempts, 'تدريبات واختبارات')].join('');
  renderStudentLessons(lessons);
  renderStudentAssessments(assessments.assessments);
  $('progress').innerHTML = progressData.progress.map(p => `<div class="progress-row"><div><strong>${escapeHtml(p.title)}</strong><small>${escapeHtml(p.subject)} • ${escapeHtml(p.level)}</small></div><div class="meter"><i style="width:${Math.max(0, Math.min(100, Number(p.mastery) || 0))}%"></i></div><strong>${escapeHtml(p.mastery)}%</strong></div>`).join('') || '<div class="empty">لا يوجد تقدم مسجل بعد.</div>';
}

function renderStudentLessons(lessons) { $('studentLessons').innerHTML = lessons.map(l => `<article class="list-card stacked"><div><h4>${escapeHtml(l.title)}</h4><p>${escapeHtml(l.subject)} • ${escapeHtml(l.level)}</p></div><details><summary>فتح الدرس</summary><div class="lesson-body">${escapeHtml(l.content)}</div></details></article>`).join('') || '<div class="empty">لا توجد دروس منشورة.</div>'; }

function renderStudentAssessments(assessments) {
  $('studentAssessments').innerHTML = assessments.map(a => { const questions = Array.isArray(a.questions?.questions) ? a.questions.questions : []; return `<article class="quiz-card"><div><h4>${escapeHtml(a.title)}</h4><p>${escapeHtml(a.subject)} • ${questions.length} سؤال</p></div><div class="quiz-questions">${questions.map((q, i) => `<fieldset><legend>${i + 1}. ${escapeHtml(q.question)}</legend>${(q.options || []).map((opt, j) => `<label class="option"><input type="radio" name="q-${a.id}-${i}" value="${j}"> ${escapeHtml(opt)}</label>`).join('')}</fieldset>`).join('')}</div><button class="primary" data-submit-quiz="${a.id}">إرسال الإجابات</button></article>`; }).join('') || '<div class="empty">لا توجد اختبارات متاحة بعد.</div>';
  document.querySelectorAll('[data-submit-quiz]').forEach(button => button.onclick = () => submitQuiz(button.dataset.submitQuiz));
}

async function submitQuiz(id) {
  const card = document.querySelector(`[data-submit-quiz="${id}"]`)?.closest('.quiz-card');
  if (!card) return;
  const answers = Array.from(card.querySelectorAll('fieldset')).map(field => Number(field.querySelector('input:checked')?.value ?? -1));
  try {
    const result = await api(`/api/assessments/${id}/submit`, { method: 'POST', body: JSON.stringify({ answers }) });
    $('quizResult').hidden = false;
    $('quizResult').innerHTML = `<h4>نتيجة الاختبار: ${result.score}%</h4><p>أجبت بشكل صحيح عن ${result.correct} من ${result.total}.</p><p>تم تحديث Mastery تلقائيًا.</p>`;
    await loadStudent();
  } catch (error) { alert(error.message); }
}

load();
