'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { query, close: closeDb } = require('../src/db');

const runId = crypto.randomUUID().slice(0, 8);

function findFreePort() {
  return new Promise((resolve, reject) => {
    const probe = http.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(error => error ? reject(error) : resolve(port));
    });
  });
}

async function startServer() {
  const port = await findFreePort();
  const child = spawn(process.execPath, ['src/launcher.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  const collect = chunk => { output += chunk.toString(); };
  child.stdout.on('data', collect);
  child.stderr.on('data', collect);

  const base = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`production launcher exited with ${child.exitCode}: ${output}`);
    try {
      const response = await fetch(`${base}/health`);
      if (response.status === 200) return { child, base };
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  child.kill('SIGTERM');
  throw new Error(`production launcher did not become healthy: ${output}`);
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  await new Promise(resolve => {
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, 5_000);
    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
    child.kill('SIGTERM');
  });
}

function cookieFrom(response) {
  const value = response.headers.get('set-cookie');
  assert.ok(value, 'expected authentication session cookie');
  return value.split(';', 1)[0];
}

async function request(base, path, { cookie, method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (cookie) headers.cookie = cookie;
  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { response, data };
}

async function register(base, role, name) {
  const email = `e2e-${role}-${runId}@example.test`;
  const password = 'E2E-password-2026!';
  const result = await request(base, '/api/auth/register', {
    method: 'POST',
    body: { name, email, password, role, tenantName: `E2E ${runId}` },
  });
  assert.equal(result.response.status, 201, JSON.stringify(result.data));
  const token = result.response.headers.get('x-eduai-verification-token');
  assert.ok(token, 'CI test requires AUTH_DEBUG_TOKENS=true');
  const verified = await request(base, '/api/auth/verify-email', {
    method: 'POST',
    body: { token },
  });
  assert.equal(verified.response.status, 200, JSON.stringify(verified.data));
  return { email, password, user: result.data.user };
}

test('real commercial journey: teacher → student → assessment → mastery → recommendation → tutor', async () => {
  const { child, base } = await startServer();
  let teacher;
  let student;
  let studentOriginalTenantId;
  let courseId;
  let lessonId;
  let assessmentId;

  try {
    teacher = await register(base, 'teacher', 'E2E Teacher');
    const teacherLogin = await request(base, '/api/auth/login', {
      method: 'POST',
      body: { email: teacher.email, password: teacher.password },
    });
    assert.equal(teacherLogin.response.status, 200, JSON.stringify(teacherLogin.data));
    const teacherCookie = cookieFrom(teacherLogin.response);

    const courseResult = await request(base, '/api/courses', {
      cookie: teacherCookie,
      method: 'POST',
      body: {
        title: `Fractions E2E ${runId}`,
        description: 'Real end-to-end adaptive learning fixture.',
        subject: 'Mathematics',
        level: 'Grade 6',
      },
    });
    assert.equal(courseResult.response.status, 201, JSON.stringify(courseResult.data));
    courseId = courseResult.data.course.id;

    const lessonResult = await request(base, '/api/lessons', {
      cookie: teacherCookie,
      method: 'POST',
      body: {
        title: `Fractions E2E Lesson ${runId}`,
        subject: 'Mathematics',
        level: 'Grade 6',
        content: 'Fractions are parts of a whole. A numerator counts selected parts and a denominator counts equal parts in the whole.',
      },
    });
    assert.equal(lessonResult.response.status, 201, JSON.stringify(lessonResult.data));
    lessonId = lessonResult.data.lesson.id;

    const attachResult = await request(base, `/api/courses/${courseId}/lessons`, {
      cookie: teacherCookie,
      method: 'POST',
      body: { lessonId, position: 1 },
    });
    assert.equal(attachResult.response.status, 200, JSON.stringify(attachResult.data));

    const publishLesson = await request(base, `/api/lessons/${lessonId}/publish`, {
      cookie: teacherCookie,
      method: 'POST',
      body: {},
    });
    assert.equal(publishLesson.response.status, 200, JSON.stringify(publishLesson.data));

    const publishCourse = await request(base, `/api/courses/${courseId}/publish`, {
      cookie: teacherCookie,
      method: 'POST',
      body: {},
    });
    assert.equal(publishCourse.response.status, 200, JSON.stringify(publishCourse.data));

    student = await register(base, 'student', 'E2E Student');
    studentOriginalTenantId = student.user.tenant_id;
    await query('UPDATE users SET tenant_id=$1 WHERE id=$2', [teacher.user.tenant_id, student.user.id]);

    const studentLogin = await request(base, '/api/auth/login', {
      method: 'POST',
      body: { email: student.email, password: student.password },
    });
    assert.equal(studentLogin.response.status, 200, JSON.stringify(studentLogin.data));
    const studentCookie = cookieFrom(studentLogin.response);

    const enrollment = await request(base, `/api/courses/${courseId}/enroll`, {
      cookie: studentCookie,
      method: 'POST',
      body: {},
    });
    assert.equal(enrollment.response.status, 201, JSON.stringify(enrollment.data));

    const courseLessons = await request(base, `/api/courses/${courseId}/lessons`, { cookie: studentCookie });
    assert.equal(courseLessons.response.status, 200, JSON.stringify(courseLessons.data));
    assert.equal(courseLessons.data.lessons.length, 1);
    assert.equal(courseLessons.data.lessons[0].id, lessonId);

    const questions = {
      questions: [
        { question: 'What is a fraction?', answer_index: 0, skill: 'Fractions', difficulty: 40, explanation: 'A fraction represents parts of a whole.' },
        { question: 'What does the denominator describe?', answer_index: 1, skill: 'Fractions', difficulty: 40, explanation: 'It describes equal parts in the whole.' },
        { question: 'What does the numerator count?', answer_index: 0, skill: 'Fractions', difficulty: 40, explanation: 'It counts selected parts.' },
      ],
    };
    const assessment = await query(
      'INSERT INTO assessments(lesson_id,tenant_id,questions,created_by) VALUES($1,$2,$3,$4) RETURNING id',
      [lessonId, teacher.user.tenant_id, JSON.stringify(questions), teacher.user.id],
    );
    assessmentId = assessment.rows[0].id;

    const assessmentList = await request(base, `/api/assessments?lessonId=${lessonId}`, { cookie: studentCookie });
    assert.equal(assessmentList.response.status, 200, JSON.stringify(assessmentList.data));
    assert.equal(assessmentList.data.assessments.length, 1);
    assert.equal(assessmentList.data.assessments[0].id, assessmentId);

    const submission = await request(base, `/api/assessments/${assessmentId}/submit`, {
      cookie: studentCookie,
      method: 'POST',
      body: { answers: [0, 1, 0] },
    });
    assert.equal(submission.response.status, 200, JSON.stringify(submission.data));
    assert.equal(submission.data.score, 100);
    assert.equal(submission.data.correct, 3);
    assert.equal(submission.data.total, 3);
    assert.ok(submission.data.progress);
    assert.ok(submission.data.adaptive);
    assert.ok(Array.isArray(submission.data.adaptive.topicMastery));
    assert.ok(submission.data.adaptive.topicMastery.length >= 1);

    const mastery = await request(base, '/api/learning/mastery', { cookie: studentCookie });
    assert.equal(mastery.response.status, 200, JSON.stringify(mastery.data));
    assert.ok(Array.isArray(mastery.data.topics));
    assert.ok(Array.isArray(mastery.data.skills));
    assert.ok(mastery.data.topics.length >= 1);

    const recommendations = await request(base, '/api/learning/recommendations', { cookie: studentCookie });
    assert.equal(recommendations.response.status, 200, JSON.stringify(recommendations.data));
    assert.ok(Array.isArray(recommendations.data.recommendations));
    assert.ok(recommendations.data.recommendations.some(item => item.lesson.id === lessonId));

    const tutor = await request(base, '/api/tutor/grounded', {
      cookie: studentCookie,
      method: 'POST',
      body: { message: 'What are fractions?', courseId, lessonId },
    });
    assert.equal(tutor.response.status, 503, JSON.stringify(tutor.data));
    assert.equal(tutor.data.error, 'خدمة الذكاء الاصطناعي غير مهيأة.');
    assert.ok(Array.isArray(tutor.data.citations));
    assert.ok(tutor.data.citations.length >= 1);
  } finally {
    if (student?.user?.id) {
      await query('DELETE FROM assessment_attempts WHERE student_id=$1', [student.user.id]);
      await query('DELETE FROM assessment_evidence WHERE student_id=$1', [student.user.id]);
      await query('DELETE FROM topic_mastery WHERE student_id=$1', [student.user.id]);
      await query('DELETE FROM skill_mastery WHERE student_id=$1', [student.user.id]);
      await query('DELETE FROM progress WHERE student_id=$1', [student.user.id]);
      await query('DELETE FROM course_memberships WHERE student_id=$1', [student.user.id]);
      await query('DELETE FROM sessions WHERE user_id=$1', [student.user.id]);
    }
    if (assessmentId) await query('DELETE FROM assessments WHERE id=$1', [assessmentId]);
    if (lessonId) await query('DELETE FROM lessons WHERE id=$1', [lessonId]);
    if (courseId) await query('DELETE FROM courses WHERE id=$1', [courseId]);
    if (student?.user?.id) {
      await query('DELETE FROM email_verification_tokens WHERE user_id=$1', [student.user.id]);
      await query('DELETE FROM mfa_challenges WHERE user_id=$1', [student.user.id]);
      await query('DELETE FROM mfa_credentials WHERE user_id=$1', [student.user.id]);
      await query('DELETE FROM users WHERE id=$1', [student.user.id]);
    }
    if (studentOriginalTenantId) await query('DELETE FROM tenants WHERE id=$1', [studentOriginalTenantId]);
    if (teacher?.user?.id) {
      await query('DELETE FROM audit_logs WHERE actor_id=$1', [teacher.user.id]);
      await query('DELETE FROM sessions WHERE user_id=$1', [teacher.user.id]);
      await query('DELETE FROM email_verification_tokens WHERE user_id=$1', [teacher.user.id]);
      await query('DELETE FROM mfa_challenges WHERE user_id=$1', [teacher.user.id]);
      await query('DELETE FROM mfa_credentials WHERE user_id=$1', [teacher.user.id]);
      await query('DELETE FROM users WHERE id=$1', [teacher.user.id]);
      await query('DELETE FROM tenants WHERE id=$1', [teacher.user.tenant_id]);
    }
    await stopServer(child);
    await closeDb();
  }
});
