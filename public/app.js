const mic = document.getElementById('mic');
const send = document.getElementById('send');
const clear = document.getElementById('clear');
const input = document.getElementById('input');
const status = document.getElementById('status');
const userText = document.getElementById('userText');
const assistantText = document.getElementById('assistantText');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'ar-EG';
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onstart = () => {
    status.textContent = 'بسمعك الآن...';
    mic.classList.add('active');
  };

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    input.value = text;
    userText.textContent = text;
    sendMessage(text);
  };

  recognition.onerror = (event) => {
    status.textContent = `تعذر استخدام الميكروفون: ${event.error}`;
  };

  recognition.onend = () => {
    mic.classList.remove('active');
    if (!status.textContent.includes('تعذر')) status.textContent = 'جاهز للاستماع';
  };
} else {
  mic.disabled = true;
  status.textContent = 'المتصفح لا يدعم التعرف الصوتي.';
}

mic.addEventListener('click', () => recognition?.start());
send.addEventListener('click', () => sendMessage(input.value));
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage(input.value);
  }
});
clear.addEventListener('click', () => {
  input.value = '';
  userText.textContent = '...';
  assistantText.textContent = '...';
  status.textContent = 'جاهز للاستماع';
});

async function sendMessage(text) {
  text = text.trim();
  if (!text) return;
  userText.textContent = text;
  assistantText.textContent = 'جاري التفكير...';
  status.textContent = 'جاري معالجة طلبك...';
  send.disabled = true;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    assistantText.textContent = data.answer;
    status.textContent = 'تمت الإجابة';
    speak(data.answer);
  } catch (error) {
    assistantText.textContent = error.message;
    status.textContent = 'حدث خطأ';
  } finally {
    send.disabled = false;
  }
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ar-EG';
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}
