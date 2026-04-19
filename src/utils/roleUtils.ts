import { getPrimaryRole, getUserRoles, isTokenValid } from '../api/auth';

/**
 * Check if user has required role
 * Works outside of React components
 */
export const checkUserRole = (requiredRoles?: string[]): boolean => {
  // If no roles required, just check if authenticated
  if (!requiredRoles || requiredRoles.length === 0) {
    return isTokenValid();
  }

  const userRole = getPrimaryRole();
  if (!userRole) return false;

  return requiredRoles.some(role => role.toLowerCase() === userRole.toLowerCase());
};

/**
 * Check if user is authenticated.
 * No side effects (no logout / no redirect).
 */
export const ensureAuthenticated = (): boolean => {
  return isTokenValid();
};

/**
 * Check if user has required role.
 * No side effects (no redirect).
 */
export const ensureAuthorized = (requiredRoles?: string[]): boolean => {
  return checkUserRole(requiredRoles);
};

/**
 * Get role-specific info
 */
export const getRoleInfo = () => {
  return {
    role: getPrimaryRole(),
    roles: getUserRoles(),
    isAuthenticated: isTokenValid(),
    isAdmin: getPrimaryRole() === 'admin',
    isEngineer: getPrimaryRole() === 'engineer',
    isNurse: getPrimaryRole() === 'nurse',
    isStaff: getPrimaryRole() === 'staff',
  };
};