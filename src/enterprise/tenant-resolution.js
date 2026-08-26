function resolveTenantFromHost(host, domainMap = {}) {
  const normalized = String(host || '').split(':')[0].trim().toLowerCase();
  if (!normalized) return null;
  return domainMap[normalized] || null;
}
function assertTenantAccess(actorTenantId, resourceTenantId) {
  if (!actorTenantId || !resourceTenantId || actorTenantId !== resourceTenantId) throw new Error('tenant access denied');
  return true;
}
module.exports = { resolveTenantFromHost, assertTenantAccess };
