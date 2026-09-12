const mic = document.getElementById('mic');
const send = document.getElementById('send');
const clear = document.getElementById('clear');
const stop = document.getElementById('stop');
const theme = document.getElementById('theme');
const input = document.getElementById('input');
const status = document.getElementById('status');
const userText = document.getElementById('userText');
const assistantText = document.getElementById('assistantText');
const messages = document.getElementById('messages');
const charCount = document.getElementById('charCount');
const quickButtons = document.querySelectorAll('[data-prompt]');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let listening = false;
let history = JSON.parse(localStorage.getItem('voice-ai-history') || '[]');
const MAX_HISTORY = 12;
const MAX_CONTEXT = 12000;
let tutorContext = null;

try {
  tutorContext = JSON.parse(localStorage.getItem('eduai-tutor-context') || 'null');
  if (!tutorContext || typeof tutorContext.content !== 'string' || !tutorContext.content.trim()) tutorContext = null;
} catch (_) {
  tutorContext = null;
}

function renderContextBanner() {
  if (!tutorContext) return;
  const banner = document.createElement('div');
  banner.className = 'tutor-context';
  banner.innerHTML = `<strong>📚 وضع الدرس</strong><span>${escapeHtml(tutorContext.title || 'الدرس الحالي')} • ${escapeHtml(tutorContext.subject || '')}</span><button type="button" id="clearTutorContext">إلغاء سياق الدرس</button>`;
  document.querySelector('.card')?.insertBefore(banner, document.querySelector('.quick-prompts'));
  document.getElementById('clearTutorContext')?.addEventListener('click', () => {
    tutorContext = null;
    localStorage.removeItem('eduai-tutor-context');
    banner.remove();
    status.textContent = 'تم إلغاء سياق الدرس';
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
}

function renderHistory() {
  messages.innerHTML = '';
  if (!history.length) {
    messages.innerHTML = '<div class="empty">ابدأ بسؤال أو اضغط على الميكروفون 🎙️</div>';
    return;
  }
  history.forEach(item => {
    const bubble = document.createElement('div');
    bubble.className = `message ${item.role}`;
    const label = document.createElement('strong');
    label.textContent = item.role === 'user' ? 'أنت' : 'المساعد';
    const text = document.createElement('span');
    text.textContent = item.content;
    bubble.append(label, text);
    messages.appendChild(bubble);
  });
  messages.scrollTop = messages.scrollHeight;
  const lastUser = [...history].reverse().find(x => x.role === 'user');
  const lastAssistant = [...history].reverse().find(x => x.role === 'assistant');
  userText.textContent = lastUser?.content || '...';
  assistantText.textContent = lastAssistant?.content || '...';
}

function saveHistory() {
  localStorage.setItem('voice-ai-history', JSON.stringify(history));
}

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'ar-EG';
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onstart = () => {
    listening = true;
    status.textContent = 'بسمعك الآن...';
    mic.classList.add('active');
  };

  recognition.onresult = event => {
    let transcript = '';
    for (const result of event.results) transcript += result[0].transcript;
    input.value = transcript;
    updateCount();
  };

  recognition.onerror = event => {
    listening = false;
    status.textContent = event.error === 'not-allowed' ? 'اسمح للمتصفح باستخدام الميكروفون.' : `مشكلة في الميكروفون: ${event.error}`;
  };

  recognition.onend = () => {
    listening = false;
    mic.classList.remove('active');
    if (input.value.trim()) sendMessage(input.value);
    else status.textContent = 'جاهز للاستماع';
  };
} else {
  mic.disabled = true;
  status.textContent = 'المتصفح لا يدعم التعرف الصوتي.';
}

mic.addEventListener('click', () => {
  if (!recognition) return;
  if (listening) recognition.stop();
  else {
    input.value = '';
    updateCount();
    try { recognition.start(); } catch (_) {}
  }
});

send.addEventListener('click', () => sendMessage(input.value));
stop.addEventListener('click', () => stopSpeaking());
clear.addEventListener('click', () => {
  history = [];
  saveHistory();
  input.value = '';
  updateCount();
  userText.textContent = '...';
  assistantText.textContent = '...';
  status.textContent = 'محادثة جديدة';
  renderHistory();
});

theme.addEventListener('click', () => {
  document.body.classList.toggle('light');
  localStorage.setItem('voice-ai-theme', document.body.classList.contains('light') ? 'light' : 'dark');
});

quickButtons.forEach(button => button.addEventListener('click', () => {
  input.value = button.dataset.prompt;
  updateCount();
  input.focus();
}));

input.addEventListener('input', updateCount);
input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage(input.value);
  }
});

async function sendMessage(text) {
  text = text.trim();
  if (!text || send.disabled) return;
  if (text.length > 2000) {
    status.textContent = 'الرسالة طويلة جدًا. الحد 2000 حرف.';
    return;
  }

  stopSpeaking();
  send.disabled = true;
  input.value = '';
  updateCount();
  status.textContent = tutorContext ? 'جاري البحث في مصادر الدرس...' : 'جاري التفكير...';

  const previousHistory = history.slice(-MAX_HISTORY);
  history.push({ role: 'user', content: text });
  renderHistory();

  try {
    let response;
    if (tutorContext) {
      response = await fetch('/api/tutor/grounded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          referenceText: tutorContext.content.slice(0, MAX_CONTEXT),
          referenceTitle: tutorContext.title || 'الدرس الحالي'
        })
      });
    } else {
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: previousHistory })
      });
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'تعذر الحصول على الرد.');
    if (!data.answer) throw new Error('لم تصل إجابة من المساعد.');

    history.push({ role: 'assistant', content: data.answer });
    history = history.slice(-MAX_HISTORY);
    saveHistory();
    renderHistory();
    status.textContent = data.citations?.length ? `تمت الإجابة من ${data.citations.length} مصدر ✓` : 'تمت الإجابة ✓';
    speak(data.answer);
  } catch (error) {
    history = history.filter(item => item.content !== text || item.role !== 'user');
    renderHistory();
    status.textContent = error.message;
  } finally {
    send.disabled = false;
  }
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ar-EG';
  utterance.rate = 0.98;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function updateCount() {
  charCount.textContent = `${input.value.length} / 2000`;
}

if (localStorage.getItem('voice-ai-theme') === 'light') document.body.classList.add('light');
renderContextBanner();
renderHistory();
updateCount();