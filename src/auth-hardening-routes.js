'use strict';

const crypto = require('node:crypto');
const { query } = require('./db');
const { hashPassword, getCurrentUser } = require('./auth');
const { rateLimit } = require('./rate-limit');
const { issueAuthToken, consumeAuthToken, createMfaEnrollment, enableMfa, verifyMfa, consumeRecoveryCode } = require('./auth-hardening');

const verificationLimiter = rateLimit({ windowMs: 15 * 60_000, max: 5 });
const resetLimiter = rateLimit({ windowMs: 15 * 60_000, max: 5 });
const mfaLimiter = rateLimit({ windowMs: 5 * 60_000, max: 10 });

function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '')); }
function publicBaseUrl() { return String(process.env.AUTH_PUBLIC_BASE_URL || '').replace(/\/$/, ''); }

async function sendEmail({ to, subject, text }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (!key || !from) {
    if (process.env.NODE_ENV !== 'production') return false;
    throw new Error('Email delivery is not configured.');
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!response.ok) throw new Error(`Email provider rejected request (${response.status}).`);
  return true;
}

function registerAuthHardening(app) {
  app.post('/api/auth/verify-email', verificationLimiter, async (req, res, next) => {
    try {
      const token = String(req.body?.token || '').trim();
      if (!token) return res.status(400).json({ error: 'رمز التحقق مطلوب.' });
      const userId = await consumeAuthToken(token, 'email_verification');
      if (!userId) return res.status(400).json({ error: 'رمز التحقق غير صالح أو منتهي الصلاحية.' });
      await query('UPDATE users SET email_verified_at=now() WHERE id=$1', [userId]);
      res.json({ verified: true });
    } catch (error) { next(error); }
  });

  app.post('/api/auth/resend-verification', verificationLimiter, async (req, res, next) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      if (!validEmail(email)) return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح.' });
      const result = await query('SELECT id,email,email_verified_at FROM users WHERE email=$1 LIMIT 1', [email]);
      if (!result.rows[0] || result.rows[0].email_verified_at) return res.json({ accepted: true });
      const token = await issueAuthToken(result.rows[0].id, 'email_verification');
      const url = publicBaseUrl() ? `${publicBaseUrl()}/verify-email?token=${encodeURIComponent(token)}` : null;
      if (url) await sendEmail({ to: email, subject: 'Verify your EduAI email', text: `Verify your EduAI account: ${url}\n\nThis link expires in 24 hours.` });
      res.json({ accepted: true, ...(process.env.NODE_ENV !== 'production' ? { development_token: token } : {}) });
    } catch (error) { next(error); }
  });

  app.post('/api/auth/forgot-password', resetLimiter, async (req, res, next) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      if (!validEmail(email)) return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح.' });
      const result = await query('SELECT id,email FROM users WHERE email=$1 LIMIT 1', [email]);
      if (result.rows[0]) {
        const token = await issueAuthToken(result.rows[0].id, 'password_reset');
        const url = publicBaseUrl() ? `${publicBaseUrl()}/reset-password?token=${encodeURIComponent(token)}` : null;
        if (url) await sendEmail({ to: email, subject: 'Reset your EduAI password', text: `Reset your EduAI password: ${url}\n\nThis link expires in 30 minutes.` });
        if (process.env.NODE_ENV !== 'production') return res.json({ accepted: true, development_token: token });
      }
      res.json({ accepted: true });
    } catch (error) { next(error); }
  });

  app.post('/api/auth/reset-password', resetLimiter, async (req, res, next) => {
    try {
      const token = String(req.body?.token || '').trim();
      const password = String(req.body?.password || '');
      if (!token || password.length < 10 || password.length > 200) return res.status(400).json({ error: 'رمز إعادة التعيين وكلمة مرور صحيحة مطلوبان.' });
      const userId = await consumeAuthToken(token, 'password_reset');
      if (!userId) return res.status(400).json({ error: 'رمز إعادة التعيين غير صالح أو منتهي الصلاحية.' });
      const passwordHash = await hashPassword(password);
      await query('UPDATE users SET password_hash=$1 WHERE id=$2', [passwordHash, userId]);
      await query('DELETE FROM sessions WHERE user_id=$1', [userId]);
      res.json({ reset: true });
    } catch (error) { next(error); }
  });

  app.post('/api/auth/mfa/setup', mfaLimiter, async (req, res, next) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ error: 'تسجيل الدخول مطلوب.' });
      const enrollment = await createMfaEnrollment(user.id);
      const label = encodeURIComponent(`${user.email}`);
      const issuer = encodeURIComponent(enrollment.issuer);
      const uri = `otpauth://totp/${issuer}:${label}?secret=${enrollment.secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
      res.json({ secret: enrollment.secret, otpauth_uri: uri });
    } catch (error) { next(error); }
  });

  app.post('/api/auth/mfa/enable', mfaLimiter, async (req, res, next) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ error: 'تسجيل الدخول مطلوب.' });
      const codes = await enableMfa(user.id, req.body?.code);
      if (!codes) return res.status(400).json({ error: 'رمز MFA غير صحيح.' });
      res.json({ enabled: true, recovery_codes: codes });
    } catch (error) { next(error); }
  });

  app.post('/api/auth/mfa/verify', mfaLimiter, async (req, res, next) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ error: 'تسجيل الدخول مطلوب.' });
      const code = String(req.body?.code || '').trim();
      const valid = /^\d{6}$/.test(code) ? await verifyMfa(user.id, code) : await consumeRecoveryCode(user.id, code);
      if (!valid) return res.status(401).json({ verified: false });
      res.json({ verified: true });
    } catch (error) { next(error); }
  });

  app.post('/api/auth/mfa/disable', mfaLimiter, async (req, res, next) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ error: 'تسجيل الدخول مطلوب.' });
      if (!(await verifyMfa(user.id, req.body?.code))) return res.status(401).json({ disabled: false });
      await query('DELETE FROM user_mfa WHERE user_id=$1', [user.id]);
      await query('DELETE FROM mfa_recovery_codes WHERE user_id=$1', [user.id]);
      res.json({ disabled: true });
    } catch (error) { next(error); }
  });
}

module.exports = { registerAuthHardening };
