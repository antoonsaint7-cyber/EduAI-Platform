const ROLES = Object.freeze(['SuperAdmin', 'SchoolAdmin', 'Teacher', 'Student']);

const PERMISSIONS = Object.freeze({
  SuperAdmin: ['*'],
  SchoolAdmin: ['school:read', 'school:write', 'users:read', 'users:write', 'courses:read', 'courses:write', 'analytics:read', 'billing:read'],
  Teacher: ['courses:read', 'courses:write', 'lessons:read', 'lessons:write', 'assessments:read', 'assessments:write', 'students:read', 'analytics:read'],
  Student: ['courses:read', 'lessons:read', 'assessments:read', 'assessments:submit', 'progress:read']
});

function hasPermission(role, permission) {
  return ROLES.includes(role) && (PERMISSIONS[role].includes('*') || PERMISSIONS[role].includes(permission));
}

function assertTenantAccess(actor, resourceTenantId) {
  if (!actor || !ROLES.includes(actor.role)) throw new Error('Unauthorized');
  if (actor.role === 'SuperAdmin') return true;
  if (!actor.tenantId || actor.tenantId !== resourceTenantId) throw new Error('Tenant access denied');
  return true;
}

module.exports = { ROLES, PERMISSIONS, hasPermission, assertTenantAccess };
