const crypto = require('node:crypto');
const { query } = require('./db');

const SESSION_DAYS = 7;
const COOKIE = 'eduai_session';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derived) => {
      if (err) return reject(err);
      resolve(`scrypt$${salt}$${derived.toString('hex')}`);
    });
  });
}

function verifyPassword(password, stored) {
  return new Promise((resolve, reject) => {
    const [algorithm, salt, hex] = String(stored).split('$');
    if (algorithm !== 'scrypt' || !salt || !hex) return resolve(false);
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derived) => {
      if (err) return reject(err);
      const expected = Buffer.from(hex, 'hex');
      resolve(expected.length === derived.length && crypto.timingSafeEqual(expected, derived));
    });
  });
}

function tokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  await query('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1,$2,$3)', [userId, tokenHash(token), expires]);
  return { token, expires };
}

function setSessionCookie(res, token, expires) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires.toUTCString()}${secure}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const item of header.split(';')) {
    const [key, ...rest] = item.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

async function getCurrentUser(req) {
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  const result = await query(
    `SELECT u.id, u.tenant_id, u.email, u.name, u.role
       FROM sessions s JOIN users u ON u.id=s.user_id
      WHERE s.token_hash=$1 AND s.expires_at > now()`,
    [tokenHash(token)]
  );
  return result.rows[0] || null;
}

module.exports = { COOKIE, normalizeEmail, hashPassword, verifyPassword, createSession, setSessionCookie, clearSessionCookie, getCurrentUser };
