const $ = id => document.getElementById(id);
const api = async (url, options = {}) => { const r = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } }); const data = r.status === 204 ? null : await r.json(); if (!r.ok) throw new Error(data?.error || 'حدث خطأ'); return data; };

async function load() {
  try {
    const { user } = await api('/api/auth/me', { headers: {} });
    $('identity').textContent = `${user.name} • ${user.role === 'teacher' ? 'مدرس' : 'طالب'}`;
    $('auth').hidden = true; $('app').hidden = false;
    if (user.role === 'teacher') { $('teacher').hidden = false; await loadTeacher(); }
    else { $('student').hidden = false; await loadStudent(); }
  } catch (_) { $('auth').hidden = false; $('identity').textContent = 'سجّل الدخول للمتابعة'; }
}

$('login').onclick = async () => { try { await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: $('email').value, password: $('password').value }) }); await load(); } catch (e) { $('authStatus').textContent = e.message; } };
$('logout').onclick = async () => { await api('/api/auth/logout', { method: 'POST' }); location.reload(); };
$('create').onclick = async () => { try { await api('/api/lessons', { method: 'POST', body: JSON.stringify({ title: $('title').value, subject: $('subject').value, level: $('level').value, content: $('content').value }) }); $('title').value=''; $('content').value=''; await loadTeacher(); } catch(e) { alert(e.message); } };

async function loadTeacher() { const { lessons } = await api('/api/lessons'); $('teacherLessons').innerHTML = lessons.map(l => `<article><h3>${escapeHtml(l.title)}</h3><p>${escapeHtml(l.subject)} • ${escapeHtml(l.level)} • ${l.status}</p>${l.status === 'review' ? `<button data-publish="${l.id}">نشر بعد المراجعة</button>` : ''}</article>`).join('') || '<p>لا توجد دروس بعد.</p>'; document.querySelectorAll('[data-publish]').forEach(b => b.onclick = async () => { await api(`/api/lessons/${b.dataset.publish}/publish`, { method: 'POST' }); await loadTeacher(); }); }
async function loadStudent() { const lessons = (await api('/api/lessons')).lessons; $('studentLessons').innerHTML = lessons.map(l => `<article><h3>${escapeHtml(l.title)}</h3><p>${escapeHtml(l.content)}</p><input type="number" min="0" max="100" id="score-${l.id}" placeholder="درجتك من 100"><button data-score="${l.id}">حفظ النتيجة</button></article>`).join('') || '<p>لا توجد دروس منشورة.</p>'; document.querySelectorAll('[data-score]').forEach(b => b.onclick = async () => { await api('/api/progress', { method: 'POST', body: JSON.stringify({ lessonId: b.dataset.score, score: Number($(`score-${b.dataset.score}`).value) }) }); await loadStudent(); }); const { progress } = await api('/api/progress'); $('progress').innerHTML = progress.map(p => `<p>${escapeHtml(p.title)}: ${p.mastery}% • محاولات ${p.attempts}</p>`).join('') || '<p>لا يوجد تقدم مسجل.</p>'; }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
load();
