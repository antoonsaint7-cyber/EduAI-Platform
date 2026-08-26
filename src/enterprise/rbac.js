const PERMISSIONS = Object.freeze({
  SuperAdmin: ['*'],
  SchoolAdmin: ['school:read','school:write','users:manage','billing:manage','analytics:read','branding:manage'],
  Teacher: ['courses:manage','assessments:manage','students:read','analytics:read'],
  Student: ['courses:read','assessments:take','profile:read','progress:read']
});
function hasPermission(role, permission) { const allowed = PERMISSIONS[role] || []; return allowed.includes('*') || allowed.includes(permission); }
module.exports = { PERMISSIONS, hasPermission };
