import assert from 'node:assert/strict';

function canAccessTenant(memberTenantId, resourceTenantId) {
  return Boolean(memberTenantId && resourceTenantId && memberTenantId === resourceTenantId);
}

assert.equal(canAccessTenant('school-a', 'school-a'), true);
assert.equal(canAccessTenant('school-a', 'school-b'), false);
assert.equal(canAccessTenant('', 'school-a'), false);
assert.equal(canAccessTenant('school-a', ''), false);

console.log('tenant isolation policy tests passed');
