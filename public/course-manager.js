(() => {
  const $ = id => document.getElementById(id);
  const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
  const api = async (url, options = {}) => {
    const headers = options.body ? { 'Content-Type': 'application/json', ...(options.headers || {}) } : (options.headers || {});
    const response = await fetch(url, { credentials: 'same-origin', ...options, headers });
    const data = response.status === 204 ? null : await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || 'حدث خطأ غير متوقع.');
    return data;
  };

  function addTeacherPanel() {
    if ($('courseManagerTeacher')) return;
    const teacher = $('teacher');
    const panel = document.createElement('article');
    panel.id = 'courseManagerTeacher';
    panel.className = 'panel';
    panel.innerHTML = `<div class="section-heading compact"><div><h3>📚 إدارة الكورسات</h3><p>أنشئ كورسًا، اربط به الدروس، ثم انشره للطلاب.</p></div><button id="refreshCourses" class="ghost">تحديث</button></div>
      <div class="form-grid"><label>اسم الكورس<input id="newCourseTitle" maxlength="200"></label><label>المادة<input id="newCourseSubject" maxlength="160"></label><label>المستوى<input id="newCourseLevel" maxlength="160"></label></div>
      <label class="full">الوصف<textarea id="newCourseDescription" rows="3" maxlength="4000"></textarea></label>
      <button id="createCourse" class="primary">إنشاء الكورس</button><div id="courseManagerStatus" class="status"></div><div id="teacherCourses" class="list-grid"></div>`;
    teacher.insertBefore(panel, teacher.firstElementChild?.nextElementSibling || teacher.firstChild);
    $('refreshCourses').onclick = loadTeacherCourses;
    $('createCourse').onclick = createCourse;
    loadTeacherCourses();
  }

  async function createCourse() {
    try {
      $('createCourse').disabled = true;
      const data = await api('/api/courses', { method: 'POST', body: JSON.stringify({
        title: $('newCourseTitle').value, subject: $('newCourseSubject').value, level: $('newCourseLevel').value, description: $('newCourseDescription').value
      }) });
      $('courseManagerStatus').textContent = `تم إنشاء «${data.course.title}» كمسودة.`;
      $('newCourseTitle').value = $('newCourseSubject').value = $('newCourseLevel').value = $('newCourseDescription').value = '';
      await loadTeacherCourses();
    } catch (e) { $('courseManagerStatus').textContent = e.message; }
    finally { $('createCourse').disabled = false; }
  }

  async function loadTeacherCourses() {
    try {
      const [{ courses }, { lessons }] = await Promise.all([api('/api/courses'), api('/api/lessons?status=review')]);
      $('teacherCourses').innerHTML = courses.map(course => `<article class="list-card stacked"><div><h4>${escapeHtml(course.title)}</h4><p>${escapeHtml(course.subject)} • ${escapeHtml(course.level)} • ${course.lesson_count} درس • ${course.student_count} طالب</p></div><div class="list-actions"><span class="badge">${escapeHtml(course.status)}</span>${course.status === 'draft' ? `<button class="primary small" data-course-publish="${course.id}">نشر</button>` : ''}</div><div class="inline-form"><select data-lesson-select="${course.id}"><option value="">اختيار درس لربطه...</option>${lessons.map(l => `<option value="${l.id}">${escapeHtml(l.title)}</option>`).join('')}</select><button class="ghost small" data-attach="${course.id}">ربط الدرس</button></div></article>`).join('') || '<div class="empty">لا توجد كورسات بعد.</div>';
      document.querySelectorAll('[data-course-publish]').forEach(btn => btn.onclick = async () => { try { await api(`/api/courses/${btn.dataset.coursePublish}/publish`, { method: 'POST' }); await loadTeacherCourses(); } catch(e) { alert(e.message); } });
      document.querySelectorAll('[data-attach]').forEach(btn => btn.onclick = async () => { const courseId = btn.dataset.attach; const lessonId = document.querySelector(`[data-lesson-select="${courseId}"]`).value; if (!lessonId) return alert('اختر درسًا أولًا.'); try { await api(`/api/courses/${courseId}/lessons`, { method: 'POST', body: JSON.stringify({ lessonId, position: 0 }) }); await loadTeacherCourses(); } catch(e) { alert(e.message); } });
    } catch (e) { if ($('teacherCourses')) $('teacherCourses').innerHTML = `<div class="empty">${escapeHtml(e.message)}</div>`; }
  }

  function addStudentPanel() {
    if ($('courseManagerStudent')) return;
    const student = $('student');
    const panel = document.createElement('article');
    panel.id = 'courseManagerStudent';
    panel.className = 'panel';
    panel.innerHTML = `<div class="section-heading compact"><div><h3>📖 كورساتي</h3><p>الكورسات المنشورة المتاحة لك، مع التسجيل والتقدم.</p></div><button id="refreshStudentCourses" class="ghost">تحديث</button></div><div id="studentCourses" class="list-grid"></div>`;
    student.insertBefore(panel, student.firstElementChild?.nextElementSibling || student.firstChild);
    $('refreshStudentCourses').onclick = loadStudentCourses;
    loadStudentCourses();
  }

  async function loadStudentCourses() {
    try {
      const { courses } = await api('/api/courses');
      $('studentCourses').innerHTML = courses.map(course => `<article class="list-card"><div><h4>${escapeHtml(course.title)}</h4><p>${escapeHtml(course.subject)} • ${escapeHtml(course.level)} • ${course.completed_lessons}/${course.lesson_count} درس</p></div><div class="list-actions"><span class="badge">${escapeHtml(course.membership_status)}</span><button class="ghost small" data-open-course="${course.id}">فتح الدروس</button></div></article>`).join('') || '<div class="empty">لا توجد كورسات مسجل بها بعد.</div>';
      document.querySelectorAll('[data-open-course]').forEach(btn => btn.onclick = () => openCourse(btn.dataset.openCourse));
    } catch (e) { if ($('studentCourses')) $('studentCourses').innerHTML = `<div class="empty">${escapeHtml(e.message)}</div>`; }
  }

  async function openCourse(courseId) {
    try {
      const { course, lessons } = await api(`/api/courses/${courseId}/lessons`);
      const box = $('studentCourses');
      box.insertAdjacentHTML('afterbegin', `<div class="result-box"><h4>${escapeHtml(course.title)}</h4>${lessons.map((l,i) => `<p><strong>${i+1}. ${escapeHtml(l.title)}</strong><br>${escapeHtml(l.content.slice(0,600))}${l.content.length>600?'…':''}</p>`).join('') || '<p>لا توجد دروس منشورة في الكورس بعد.</p>'}</div>`);
    } catch(e) { alert(e.message); }
  }

  async function init() {
    try {
      const { user } = await api('/api/auth/me');
      if (user.role === 'teacher') addTeacherPanel();
      if (user.role === 'student') addStudentPanel();
    } catch (_) {}
  }
  setTimeout(init, 0);
})();
