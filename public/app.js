// EduAI Platform - Main Application
const API_BASE = '/api';
const STORAGE_TOKEN = 'eduai_token';
const STORAGE_USER = 'eduai_user';
const STORAGE_LANG = 'eduai_lang';

const i18n = {
  ar: {
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    logout: 'تسجيل الخروج',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    name: 'الاسم',
    confirmPassword: 'تأكيد كلمة المرور',
    teacherRole: 'معلم',
    studentRole: 'طالب',
    schoolName: 'اسم المدرسة',
    dashboard: 'لوحة التحكم',
    lessons: 'الدروس',
    assessments: 'الاختبارات',
    progress: 'التقدم',
    settings: 'الإعدادات',
    welcome: 'مرحبا',
    startLearning: 'ابدأ التعلم',
    createLesson: 'إنشاء درس',
    title: 'العنوان',
    subject: 'المادة',
    level: 'المستوى',
    content: 'المحتوى',
    submit: 'إرسال',
    cancel: 'إلغاء',
    error: 'حدث خطأ',
    success: 'تم بنجاح',
    loading: 'جاري التحميل...',
    noData: 'لا توجد بيانات',
    invalidEmail: 'البريد الإلكتروني غير صحيح',
    passwordTooShort: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
    passwordMismatch: 'كلمات المرور غير متطابقة',
    sessionExpired: 'انتهت جلستك، يرجى تسجيل الدخول مرة أخرى',
    questionCount: 'عدد الأسئلة',
    correctAnswers: 'الإجابات الصحيحة',
    score: 'الدرجة',
    mastery: 'الإتقان',
    difficulty: 'الصعوبة',
    yourProgress: 'تقدمك',
    lessonsCompleted: 'الدروس المكتملة',
    averageMastery: 'متوسط الإتقان',
    students: 'الطلاب',
    teachers: 'المعلمون',
    analytics: 'التحليلات',
    viewDetails: 'عرض التفاصيل',
    edit: 'تعديل',
    delete: 'حذف',
    publish: 'نشر',
    draft: 'مسودة',
    published: 'منشور',
    nextQuestion: 'السؤال التالي',
    finishAssessment: 'إنهاء الاختبار',
    yourScore: 'درجتك',
    reviewAnswers: 'راجع إجاباتك'
  },
  en: {
    login: 'Login',
    register: 'Create Account',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    confirmPassword: 'Confirm Password',
    teacherRole: 'Teacher',
    studentRole: 'Student',
    schoolName: 'School Name',
    dashboard: 'Dashboard',
    lessons: 'Lessons',
    assessments: 'Assessments',
    progress: 'Progress',
    settings: 'Settings',
    welcome: 'Welcome',
    startLearning: 'Start Learning',
    createLesson: 'Create Lesson',
    title: 'Title',
    subject: 'Subject',
    level: 'Level',
    content: 'Content',
    submit: 'Submit',
    cancel: 'Cancel',
    error: 'Error occurred',
    success: 'Success',
    loading: 'Loading...',
    noData: 'No data available',
    invalidEmail: 'Invalid email address',
    passwordTooShort: 'Password must be at least 8 characters',
    passwordMismatch: 'Passwords do not match',
    sessionExpired: 'Your session has expired, please login again',
    questionCount: 'Question Count',
    correctAnswers: 'Correct Answers',
    score: 'Score',
    mastery: 'Mastery',
    difficulty: 'Difficulty',
    yourProgress: 'Your Progress',
    lessonsCompleted: 'Lessons Completed',
    averageMastery: 'Average Mastery',
    students: 'Students',
    teachers: 'Teachers',
    analytics: 'Analytics',
    viewDetails: 'View Details',
    edit: 'Edit',
    delete: 'Delete',
    publish: 'Publish',
    draft: 'Draft',
    published: 'Published',
    nextQuestion: 'Next Question',
    finishAssessment: 'Finish Assessment',
    yourScore: 'Your Score',
    reviewAnswers: 'Review Your Answers'
  }
};

function t(key) {
  const lang = localStorage.getItem(STORAGE_LANG) || 'ar';
  return i18n[lang]?.[key] || key;
}

function setLanguage(lang) {
  localStorage.setItem(STORAGE_LANG, lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  render();
}

class App {
  constructor() {
    this.user = this.loadUser();
    this.currentPage = this.user ? 'dashboard' : 'login';
  }

  loadUser() {
    const stored = localStorage.getItem(STORAGE_USER);
    return stored ? JSON.parse(stored) : null;
  }

  saveUser(user) {
    this.user = user;
    localStorage.setItem(STORAGE_USER, JSON.stringify(user));
  }

  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error(t('error'));
      const data = await res.json();
      this.saveUser(data.user);
      this.currentPage = 'dashboard';
      render();
    } catch (error) {
      showError(error.message);
    }
  }

  async register(email, password, name, role, tenantName) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role, tenantName })
      });
      if (!res.ok) throw new Error(t('error'));
      const data = await res.json();
      showSuccess(t('success'));
      setTimeout(() => { this.currentPage = 'login'; render(); }, 1000);
    } catch (error) {
      showError(error.message);
    }
  }

  logout() {
    this.user = null;
    localStorage.removeItem(STORAGE_USER);
    this.currentPage = 'login';
    render();
  }
}

const app = new App();

function showError(message) {
  const alert = document.createElement('div');
  alert.className = 'error';
  alert.textContent = message;
  alert.style.position = 'fixed';
  alert.style.top = '20px';
  alert.style.right = '20px';
  alert.style.background = '#fee2e2';
  alert.style.padding = '1rem';
  alert.style.borderRadius = '0.375rem';
  alert.style.zIndex = '9999';
  document.body.appendChild(alert);
  setTimeout(() => alert.remove(), 5000);
}

function showSuccess(message) {
  const alert = document.createElement('div');
  alert.className = 'success';
  alert.textContent = message;
  alert.style.position = 'fixed';
  alert.style.top = '20px';
  alert.style.right = '20px';
  alert.style.zIndex = '9999';
  document.body.appendChild(alert);
  setTimeout(() => alert.remove(), 3000);
}

function render() {
  const root = document.getElementById('root');
  root.innerHTML = '';

  if (!app.user) {
    if (app.currentPage === 'login') {
      root.appendChild(createLoginPage());
    } else if (app.currentPage === 'register') {
      root.appendChild(createRegisterPage());
    }
  } else {
    root.appendChild(createLayout());
  }
}

function createLoginPage() {
  const div = document.createElement('div');
  div.className = 'auth-container';
  div.innerHTML = `
    <div class="auth-card">
      <h1>🎓 ${t('login')}</h1>
      <form id="loginForm">
        <div class="form-group">
          <label>${t('email')}</label>
          <input type="email" name="email" required>
        </div>
        <div class="form-group">
          <label>${t('password')}</label>
          <input type="password" name="password" required>
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%;">${t('login')}</button>
      </form>
      <div class="auth-links">
        ${t('noData')}? <a href="#" onclick="app.currentPage='register'; render(); return false;">${t('register')}</a>
      </div>
    </div>
  `;
  div.querySelector('#loginForm').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    app.login(fd.get('email'), fd.get('password'));
  };
  return div;
}

function createRegisterPage() {
  const div = document.createElement('div');
  div.className = 'auth-container';
  div.innerHTML = `
    <div class="auth-card">
      <h1>🎓 ${t('register')}</h1>
      <form id="registerForm">
        <div class="form-group">
          <label>${t('name')}</label>
          <input type="text" name="name" required>
        </div>
        <div class="form-group">
          <label>${t('email')}</label>
          <input type="email" name="email" required>
        </div>
        <div class="form-group">
          <label>${t('password')}</label>
          <input type="password" name="password" required>
        </div>
        <div class="form-group">
          <label>${t('confirmPassword')}</label>
          <input type="password" name="confirmPassword" required>
        </div>
        <div class="form-group">
          <label>${t('schoolName')}</label>
          <input type="text" name="schoolName" required>
        </div>
        <div class="form-group">
          <label>${t('role')}</label>
          <select name="role" required>
            <option value="student">${t('studentRole')}</option>
            <option value="teacher">${t('teacherRole')}</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%;">${t('register')}</button>
      </form>
      <div class="auth-links">
        ${t('haveAccount')}? <a href="#" onclick="app.currentPage='login'; render(); return false;">${t('login')}</a>
      </div>
    </div>
  `;
  div.querySelector('#registerForm').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (fd.get('password') !== fd.get('confirmPassword')) {
      showError(t('passwordMismatch'));
      return;
    }
    app.register(fd.get('email'), fd.get('password'), fd.get('name'), fd.get('role'), fd.get('schoolName'));
  };
  return div;
}

function createLayout() {
  const div = document.createElement('div');
  div.innerHTML = `
    <header>
      <nav class="container">
        <div class="logo">🎓 EduAI</div>
        <ul class="nav-links">
          <li><a href="#" class="nav-link" data-page="dashboard">${t('dashboard')}</a></li>
          <li><a href="#" class="nav-link" data-page="lessons">${t('lessons')}</a></li>
          <li><a href="#" class="nav-link" data-page="assessments">${t('assessments')}</a></li>
          <li><a href="#" class="nav-link" data-page="progress">${t('progress')}</a></li>
          <li>
            <select onchange="setLanguage(this.value)" style="padding: 0.5rem;">
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </li>
          <li><button class="btn btn-danger btn-small" onclick="app.logout()">${t('logout')}</button></li>
        </ul>
      </nav>
    </header>
    <div class="container" id="content"></div>
  `;
  
  const contentDiv = div.querySelector('#content');
  if (app.currentPage === 'dashboard') contentDiv.appendChild(createDashboard());
  else if (app.currentPage === 'lessons') contentDiv.appendChild(createLessonsPage());
  else if (app.currentPage === 'assessments') contentDiv.appendChild(createAssessmentsPage());
  else if (app.currentPage === 'progress') contentDiv.appendChild(createProgressPage());
  else contentDiv.appendChild(createDashboard());

  // Add navigation listeners
  div.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      app.currentPage = el.dataset.page;
      render();
    });
  });

  return div;
}

function createDashboard() {
  const div = document.createElement('div');
  div.innerHTML = `
    <h2>${t('welcome')}, ${app.user.name}!</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <h3>${t('lessonsCompleted')}</h3>
        <div class="value">0</div>
      </div>
      <div class="stat-card">
        <h3>${t('averageMastery')}</h3>
        <div class="value">0%</div>
      </div>
      <div class="stat-card">
        <h3>${t('students')}</h3>
        <div class="value">0</div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">${t('startLearning')}</div>
      <button class="btn btn-primary" onclick="app.currentPage='lessons'; render();">${t('lessons')}</button>
    </div>
  `;
  return div;
}

function createLessonsPage() {
  const div = document.createElement('div');
  div.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2>${t('lessons')}</h2>
      ${app.user.role === 'teacher' ? `<button class="btn btn-primary" onclick="alert('${t('createLesson')}')">${t('createLesson')}</button>` : ''}
    </div>
    <div class="card">
      <p>${t('noData')}</p>
    </div>
  `;
  return div;
}

function createAssessmentsPage() {
  const div = document.createElement('div');
  div.innerHTML = `
    <h2>${t('assessments')}</h2>
    <div class="card">
      <p>${t('noData')}</p>
    </div>
  `;
  return div;
}

function createProgressPage() {
  const div = document.createElement('div');
  div.innerHTML = `
    <h2>${t('yourProgress')}</h2>
    <div class="card">
      <div class="card-title">${t('averageMastery')}</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: 0%;"></div>
      </div>
      <p>${t('noData')}</p>
    </div>
  `;
  return div;
}

// Initialize
render();