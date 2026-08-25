const crypto = require('node:crypto');
const { query } = require('./db');

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const secret = process.env.AUTH_SECRET;

function requireSecret() {
  if (!secret || secret.length < 32) throw new Error('AUTH_SECRET must be at least 32 characters.');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, expected] = String(stored).split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}
function encodeToken(payload) {
  requireSecret();
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}
function decodeToken(token) {
  requireSecret();
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) throw new Error('Invalid session');
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) throw new Error('Invalid session');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Session expired');
  return payload;
}

async function register({ email, password, role = 'student' }) {
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Invalid email');
  if (password.length < 10) throw new Error('Password must be at least 10 characters');
  if (!['student', 'teacher'].includes(role)) role = 'student';
  const id = crypto.randomUUID();
  const passwordHash = hashPassword(password);
  const result = await query('INSERT INTO users (id,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING id,email,role', [id, email.toLowerCase(), passwordHash, role]);
  return result.rows[0];
}

async function login({ email, password }) {
  const result = await query('SELECT id,email,password_hash,role FROM users WHERE email=$1', [email.toLowerCase()]);
  const user = result.rows[0];
  if (!user || !verifyPassword(password, user.password_hash)) throw new Error('Invalid credentials');
  return { user: { id: user.id, email: user.email, role: user.role }, token: encodeToken({ sub: user.id, email: user.email, role: user.role }) };
}

function auth(required = true) {
  return (req, res, next) => {
    try {
      const header = req.get('authorization') || '';
      if (!header.startsWith('Bearer ')) {
        if (!required && process.env.NODE_ENV !== 'production') return next();
        return res.status(401).json({ error: 'تسجيل الدخول مطلوب.' });
      }
      req.user = decodeToken(header.slice(7));
      next();
    } catch { res.status(401).json({ error: 'جلسة الدخول غير صالحة.' }); }
  };
}
function requireRole(...roles) {
  return (req, res, next) => roles.includes(req.user?.role) ? next() : res.status(403).json({ error: 'ليس لديك صلاحية لهذا الإجراء.' });
}

module.exports = { register, login, auth, requireRole, encodeToken };
