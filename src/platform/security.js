const crypto = require('node:crypto');

function safeText(value, max = 4000) { return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, max); }
function assertSafeFilename(name) { const value = safeText(name, 255); if (!value || /[\\/]/.test(value) || value.includes('..')) throw new Error('Unsafe filename'); return value; }
function hashContent(buffer) { return crypto.createHash('sha256').update(buffer).digest('hex'); }
function isPromptInjectionLike(text) { return /ignore\s+(all|previous)\s+instructions|system\s+message|developer\s+message|reveal\s+(the\s+)?prompt|api\s*key/i.test(String(text || '')); }
module.exports = { safeText, assertSafeFilename, hashContent, isPromptInjectionLike };
