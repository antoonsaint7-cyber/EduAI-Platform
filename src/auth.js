const crypto = require('crypto');
const { query } = require('./db');

const TOKEN_TTL = 8 * 60 * 60;
const secret = () => process.env.AUTH_SECRET || 'change-me-in-production';

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
function sign(payload) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now()/1000) + TOKEN_TTL })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}
function verify(token) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (!payload.exp || payload.exp < Math.floor(Date.now()/1000)) return null;
  return payload;
}
function tokenFromRequest(req) { const h = req.headers.authorization || ''; return h.startsWith('Bearer ') ? h.slice(7) : null; }

async function requireAuth(req, res, next) {
  try {
    const payload = verify(tokenFromRequest(req));
    if (!payload?.userId || !payload?.tenantId) return res.status(401).json({ error: 'Authentication required.' });
    const { rows } = await query('SELECT id,email,role,tenant_id FROM users WHERE id=$1 AND status=\'active\'', [payload.userId]);
    if (!rows[0] || rows[0].tenant_id !== payload.tenantId) return res.status(401).json({ error: 'Invalid session.' });
    req.user = { id: rows[0].id, email: rows[0].email, role: rows[0].role, tenantId: rows[0].tenant_id };
    next();
  } catch { res.status(401).json({ error: 'Invalid session.' }); }
}
function requireRole(...roles) { return (req,res,next) => roles.includes(req.user?.role) ? next() : res.status(403).json({ error: 'Insufficient permissions.' }); }

module.exports = { hashPassword, verifyPassword, sign, verify, requireAuth, requireRole };
