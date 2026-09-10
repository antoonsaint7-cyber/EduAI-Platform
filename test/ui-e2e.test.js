const { test, describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const { app, close } = require('../server');

let server;
const BASE_URL = 'http://localhost:3000';

const TEST_TEACHER = {
  email: 'teacher1@school.test',
  password: 'TestPass123!',
  name: 'معلم 1'
};

const TEST_STUDENT = {
  email: 'student1@school.test',
  password: 'TestPass123!',
  name: 'طالب 1'
};

describe('UI E2E Tests', () => {
  before(async () => {
    server = await new Promise((resolve) => {
      const s = app.listen(3001, () => resolve(s));
    });
  });

  after(async () => {
    server.close();
    await close();
  });

  it('should serve login page', async () => {
    const res = await fetch('http://localhost:3001/');
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.match(html, /تسجيل الدخول/);
  });

  it('should serve CSS and JavaScript', async () => {
    const cssRes = await fetch('http://localhost:3001/styles.css');
    const jsRes = await fetch('http://localhost:3001/app.js');
    assert.strictEqual(cssRes.status, 200);
    assert.strictEqual(jsRes.status, 200);
  });

  it('should login teacher successfully', async () => {
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_TEACHER.email,
        password: TEST_TEACHER.password
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user.role, 'teacher');
    assert.strictEqual(data.user.name, TEST_TEACHER.name);
  });

  it('should login student successfully', async () => {
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_STUDENT.email,
        password: TEST_STUDENT.password
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user.role, 'student');
  });

  it('should reject invalid login', async () => {
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid@test.com',
        password: 'wrongpass'
      })
    });
    assert.strictEqual(res.status, 401);
  });
});

describe('Dashboard API Tests', () => {
  before(async () => {
    server = await new Promise((resolve) => {
      const s = app.listen(3002, () => resolve(s));
    });
  });

  after(async () => {
    server.close();
    await close();
  });

  it('should fetch lessons for teacher', async () => {
    // First login
    const loginRes = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_TEACHER)
    });
    const loginData = await loginRes.json();
    const token = loginData.user.id; // Simplified - in real app, use session token

    // Then fetch lessons
    const lessonsRes = await fetch('http://localhost:3002/api/lessons', {
      headers: { 'Cookie': `eduai_session=${token}` }
    });
    assert.strictEqual(lessonsRes.status, 200);
    const lessons = await lessonsRes.json();
    assert(Array.isArray(lessons));
  });

  it('should fetch student progress', async () => {
    const loginRes = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_STUDENT)
    });
    const loginData = await loginRes.json();

    const progressRes = await fetch('http://localhost:3002/api/progress', {
      headers: { 'Cookie': `eduai_session=${loginData.user.id}` }
    });
    assert.strictEqual(progressRes.status, 200);
    const progress = await progressRes.json();
    assert(Array.isArray(progress));
  });
});