export const ROLES = Object.freeze({ STUDENT: 'student', TEACHER: 'teacher', ADMIN: 'admin' });

export const permissions = Object.freeze({
  student: ['read:published'],
  teacher: ['read:published', 'create:curriculum', 'review:curriculum', 'publish:curriculum', 'rollback:curriculum'],
  admin: ['read:published', 'create:curriculum', 'review:curriculum', 'publish:curriculum', 'rollback:curriculum', 'manage:users']
});

export function can(role, permission) {
  return Boolean(permissions[role]?.includes(permission));
}
