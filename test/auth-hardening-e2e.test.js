const express = require('express');
const crypto = require('node:crypto');
const OpenAI = require('openai');
const { query, withTransaction, close } = require('./src/db');
const { normalizeEmail, hashPassword, verifyPassword, createSession, setSessionCookie, clearSessionCookie, getCurrentUser } = require('./src/auth');
const { validatePassword, hashToken, createResetToken, createVerificationToken, createMfaChallenge, createMfaSecret, createRecoveryCodes, hashRecoveryCode, verifyTotp, MFA_MAX_ATTEMPTS } = require('./src/auth-security');
const { rateLimit } = require('./src/rate-limit');
const { buildEducationalPrompt } = require('./src/education');
const { generateLesson, generateCourse, generateQuiz } = require('./src/ai-content');
const { applyAdaptiveAssessment } = require('./src/adaptive-api');

const app = express();
const port = Number(process.env.PORT || 3000);
const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY = 12;
const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'microphone=(self)');
  if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json', limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.static('public', { extensions: ['html'] }));

const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20 });
const chatLimiter = rateLimit({ windowMs: 60_000, max: 20 });
const writeLimiter = rateLimit({ windowMs: 60_000, max: 60 });
const aiLimiter = rateLimit({ windowMs: 60_000, max: 10 });

function validText(value, max = 160) { return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max; }
function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function safeUser(user) { const copy = { ...user }; delete copy.password_hash; delete copy.mfa_secret; return copy; }
function exposeDevToken(res, key, value) { if (process.env.NODE_ENV !== 'production' && process.env.AUTH_DEBUG_TOKENS === 'true') res.setHeader(`X-EduAI-${key}`, value); }
function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      req.user = await getCurrentUser(req);
      if (!req.user) return res.status(401).json({ error: 'تسجيل الدخول مطلوب.' });
      if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'ليس لديك صلاحية لهذه العملية.' });
      return next();
    } catch (error) { return next(error); }
  };
}

app.get('/health', async (_req, res, next) => {
  try {
    if (process.env.DATABASE_URL) await query('SELECT 1');
    res.json({ status: 'ok', database: Boolean(process.env.DATABASE_URL) });
  } catch (error) { next(error); }
});

app.post('/api/auth/register', authLimiter, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const role = req.body?.role === 'teacher' ? 'teacher' : 'student';
    const tenantName = String(req.body?.tenantName || `${name} School`).trim();
    if (!validText(name) || !validEmail(email) || !validatePassword(password) || !validText(tenantName, 160)) return res.status(400).json({ error: 'الاسم والبريد وكلمة المرور (10 أحرف على الأقل) واسم المؤسسة مطلوبة بشكل صحيح.' });
    const result = await withTransaction(async db => {
      const tenant = await db.query('INSERT INTO tenants(name) VALUES($1) RETURNING id', [tenantName]);
      const passwordHash = await hashPassword(password);
      const user = await db.query('INSERT INTO users(tenant_id,email,password_hash,role,name) VALUES($1,$2,$3,$4,$5) RETURNING id,tenant_id,email,name,role,email_verified_at,mfa_enabled', [tenant.rows[0].id, email, passwordHash, role, name]);
      return user.rows[0];
    });
    const verification = createVerificationToken();
    await query('DELETE FROM email_verification_tokens WHERE user_id=$1', [result.id]);
    await query('INSERT INTO email_verification_tokens(user_id,token_hash,expires_at) VALUES($1,$2,$3)', [result.id, verification.tokenHash, verification.expiresAt]);
    exposeDevToken(res, 'Verification-Token', verification.token);
    res.status(201).json({ user: safeUser(result), verification_required: true });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'البريد الإلكتروني مستخدم بالفعل.' });
    next(error);
  }
});

app.post('/api/auth/verify-email', authLimiter, async (req, res, next) => {
  try {
    const token = String(req.body?.token || '').trim();
    if (!token) return res.status(400).json({ error: 'رمز التحقق مطلوب.' });
    const result = await query(`UPDATE users u SET email_verified_at=now() FROM email_verification_tokens t WHERE t.user_id=u.id AND t.token_hash=$1 AND t.expires_at > now() RETURNING u.id,u.tenant_id,u.email,u.name,u.role,u.email_verified_at,u.mfa_enabled`, [hashToken(token)]);
    if (!result.rows[0]) return res.status(400).json({ error: 'رمز التحقق غير صالح أو منتهي.' });
    await query('DELETE FROM email_verification_tokens WHERE user_id=$1', [result.rows[0].id]);
    res.json({ user: safeUser(result.rows[0]), verified: true });
  } catch (error) { next(error); }
});

app.post('/api/auth/resend-verification', authLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!validEmail(email)) return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح.' });
    const result = await query('SELECT id,email_verified_at FROM users WHERE email=$1 LIMIT 1', [email]);
    if (result.rows[0] && !result.rows[0].email_verified_at) {
      const verification = createVerificationToken();
      await query('DELETE FROM email_verification_tokens WHERE user_id=$1', [result.rows[0].id]);
      await query('INSERT INTO email_verification_tokens(user_id,token_hash,expires_at) VALUES($1,$2,$3)', [result.rows[0].id, verification.tokenHash, verification.expiresAt]);
      exposeDevToken(res, 'Verification-Token', verification.token);
    }
    res.json({ sent: true });
  } catch (error) { next(error); }
});

app.post('/api/auth/login', authLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    if (!validEmail(email) || !password) return res.status(400).json({ error: 'البريد وكلمة المرور مطلوبان.' });
    const result = await query('SELECT id,tenant_id,email,password_hash,name,role,email_verified_at,mfa_enabled FROM users WHERE email=$1 LIMIT 1', [email]);
    const user = result.rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة.' });
    if (!user.email_verified_at) return res.status(403).json({ error: 'يجب تأكيد البريد الإلكتروني قبل تسجيل الدخول.', verification_required: true });
    if (user.mfa_enabled) {
      const challenge = createMfaChallenge();
      await query('DELETE FROM mfa_challenges WHERE user_id=$1', [user.id]);
      await query('INSERT INTO mfa_challenges(user_id,token_hash,expires_at) VALUES($1,$2,$3)', [user.id, challenge.tokenHash, challenge.expiresAt]);
      return res.json({ mfa_required: true, challenge_token: challenge.token });
    }
    const session = await createSession(user.id);
    setSessionCookie(res, session.token, session.expires);
    res.json({ user: safeUser(user) });
  } catch (error) { next(error); }
});

app.post('/api/auth/mfa/verify-login', authLimiter, async (req, res, next) => {
  try {
    const challengeToken = String(req.body?.challengeToken || '').trim();
    const code = String(req.body?.code || '').trim();
    if (!challengeToken || !code) return res.status(400).json({ error: 'رمز التحدي ورمز MFA مطلوبان.' });
    const result = await query(`SELECT c.id,c.user_id,c.expires_at,c.attempts,m.secret,m.recovery_code_hashes FROM mfa_challenges c JOIN mfa_credentials m ON m.user_id=c.user_id JOIN users u ON u.id=c.user_id WHERE c.token_hash=$1 AND c.expires_at > now() AND u.mfa_enabled=true LIMIT 1`, [hashToken(challengeToken)]);
    const challenge = result.rows[0];
    if (!challenge) return res.status(401).json({ error: 'تحدي MFA غير صالح أو منتهي.' });
    const recovery = Array.isArray(challenge.recovery_code_hashes) ? challenge.recovery_code_hashes : [];
    const recoveryHash = hashRecoveryCode(code);
    const recoveryIndex = recovery.findIndex(item => typeof item === 'string' && item === recoveryHash);
    const valid = verifyTotp(challenge.secret, code) || recoveryIndex >= 0;
    if (!valid) {
      if (challenge.attempts + 1 >= MFA_MAX_ATTEMPTS) await query('DELETE FROM mfa_challenges WHERE id=$1', [challenge.id]);
      else await query('UPDATE mfa_challenges SET attempts=attempts+1 WHERE id=$1', [challenge.id]);
      return res.status(401).json({ error: 'رمز MFA غير صحيح.' });
    }
    if (recoveryIndex >= 0) {
      recovery.splice(recoveryIndex, 1);
      await query('UPDATE mfa_credentials SET recovery_code_hashes=$2::jsonb WHERE user_id=$1', [challenge.user_id, JSON.stringify(recovery)]);
    }
    await query('DELETE FROM mfa_challenges WHERE id=$1', [challenge.id]);
    const userResult = await query('SELECT id,tenant_id,email,name,role,email_verified_at,mfa_enabled FROM users WHERE id=$1', [challenge.user_id]);
    const session = await createSession(challenge.user_id);
    setSessionCookie(res, session.token, session.expires);
    res.json({ user: safeUser(userResult.rows[0]), authenticated: true });
  } catch (error) { next(error); }
});

app.post('/api/auth/mfa/setup', requireRole('teacher', 'student'), async (req, res, next) => {
  try {
    const existing = await query('SELECT user_id,confirmed_at FROM mfa_credentials WHERE user_id=$1', [req.user.id]);
    if (existing.rows[0]?.confirmed_at) return res.status(409).json({ error: 'MFA مفعل بالفعل.' });
    const secret = createMfaSecret();
    const recoveryCodes = createRecoveryCodes();
    await query('INSERT INTO mfa_credentials(user_id,secret,recovery_code_hashes) VALUES($1,$2,$3::jsonb) ON CONFLICT(user_id) DO UPDATE SET secret=EXCLUDED.secret,recovery_code_hashes=EXCLUDED.recovery_code_hashes,confirmed_at=NULL', [req.user.id, secret, JSON.stringify(recoveryCodes.map(hashRecoveryCode))]);
    res.json({ secret, recovery_codes: recoveryCodes, setup_required: true });
  } catch (error) { next(error); }
});

app.post('/api/auth/mfa/confirm', requireRole('teacher', 'student'), async (req, res, next) => {
  try {
    const code = String(req.body?.code || '').trim();
    const result = await query('SELECT secret FROM mfa_credentials WHERE user_id=$1', [req.user.id]);
    if (!result.rows[0] || !verifyTotp(result.rows[0].secret, code)) return res.status(400).json({ error: 'رمز TOTP غير صحيح.' });
    await query('UPDATE mfa_credentials SET confirmed_at=now() WHERE user_id=$1', [req.user.id]);
    await query('UPDATE users SET mfa_enabled=true WHERE id=$1', [req.user.id]);
    res.json({ enabled: true });
  } catch (error) { next(error); }
});

app.post('/api/auth/mfa/disable', requireRole('teacher', 'student'), async (req, res, next) => {
  try {
    const code = String(req.body?.code || '').trim();
    const result = await query('SELECT secret FROM mfa_credentials WHERE user_id=$1 AND confirmed_at IS NOT NULL', [req.user.id]);
    if (!result.rows[0] || !verifyTotp(result.rows[0].secret, code)) return res.status(400).json({ error: 'رمز TOTP غير صحيح.' });
    await query('UPDATE users SET mfa_enabled=false WHERE id=$1', [req.user.id]);
    await query('DELETE FROM mfa_challenges WHERE user_id=$1', [req.user.id]);
    res.json({ enabled: false });
  } catch (error) { next(error); }
});

app.post('/api/auth/password-reset/request', authLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!validEmail(email)) return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح.' });
    const result = await query('SELECT id FROM users WHERE email=$1 LIMIT 1', [email]);
    if (result.rows[0]) {
      const reset = createResetToken();
      await query('DELETE FROM password_reset_tokens WHERE user_id=$1 AND used_at IS NULL', [result.rows[0].id]);
      await query('INSERT INTO password_reset_tokens(user_id,token_hash,expires_at) VALUES($1,$2,$3)', [result.rows[0].id, reset.tokenHash, reset.expiresAt]);
      exposeDevToken(res, 'Reset-Token', reset.token);
    }
    res.json({ sent: true });
  } catch (error) { next(error); }
});

app.post('/api/auth/password-reset/confirm', authLimiter, async (req, res, next) => {
  try {
    const token = String(req.body?.token || '').trim();
    const password = String(req.body?.password || '');
    if (!token || !validatePassword(password)) return res.status(400).json({ error: 'رمز إعادة التعيين وكلمة المرور الجديدة مطلوبان بشكل صحيح.' });
    const result = await query('SELECT id,user_id FROM password_reset_tokens WHERE token_hash=$1 AND used_at IS NULL AND expires_at > now() LIMIT 1', [hashToken(token)]);
    if (!result.rows[0]) return res.status(400).json({ error: 'رمز إعادة التعيين غير صالح أو منتهي.' });
    const passwordHash = await hashPassword(password);
    await withTransaction(async db => {
      await db.query('UPDATE users SET password_hash=$2 WHERE id=$1', [result.rows[0].user_id, passwordHash]);
      await db.query('UPDATE password_reset_tokens SET used_at=now() WHERE id=$1', [result.rows[0].id]);
      await db.query('DELETE FROM sessions WHERE user_id=$1', [result.rows[0].user_id]);
    });
    res.json({ reset: true });
  } catch (error) { next(error); }
});

app.get('/api/auth/me', async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: 'تسجيل الدخول مطلوب.' });
    res.json({ user: safeUser(user) });
  } catch (error) { next(error); }
});
