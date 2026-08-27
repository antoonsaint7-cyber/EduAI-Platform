const ENTERPRISE_ROLES = Object.freeze(['SuperAdmin', 'SchoolAdmin', 'Teacher', 'Student']);
const DEFAULT_QUOTAS = Object.freeze({
  Free: { monthlyTokens: 100000, students: 25, teachers: 3 },
  Teacher: { monthlyTokens: 500000, students: 100, teachers: 10 },
  School: { monthlyTokens: 5000000, students: 2000, teachers: 200 },
  Enterprise: { monthlyTokens: 50000000, students: 20000, teachers: 2000 }
});
function getQuota(plan = 'Free', overrides = {}) { const base = DEFAULT_QUOTAS[plan] || DEFAULT_QUOTAS.Free; return { ...base, ...overrides }; }
function consumeTokens(usage, amount, quota) {
  const current = Math.max(0, Number(usage) || 0), requested = Math.max(0, Number(amount) || 0), limit = Math.max(0, Number(quota) || 0);
  if (current + requested > limit) return { allowed: false, used: current, requested, limit, remaining: Math.max(0, limit - current) };
  const used = current + requested; return { allowed: true, used, requested, limit, remaining: limit - used };
}
const BRANDING_DEFAULTS = Object.freeze({ logoUrl: null, primaryColor: '#2563eb', secondaryColor: '#0f172a', faviconUrl: null });
function normalizeTenantBranding(branding = {}) { return { ...BRANDING_DEFAULTS, ...branding }; }
function validateCustomDomain(domain) {
  const value = String(domain || '').trim().toLowerCase();
  if (!/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(value)) throw new Error('invalid custom domain');
  return value;
}
module.exports = { ENTERPRISE_ROLES, DEFAULT_QUOTAS, getQuota, consumeTokens, BRANDING_DEFAULTS, normalizeTenantBranding, validateCustomDomain };
