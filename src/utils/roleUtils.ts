import { getPrimaryRole, getUserRoles, isTokenValid, logoutUser } from '../api/auth';

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
 * Check if user is authenticated and redirect if not
 */
export const ensureAuthenticated = (): boolean => {
  if (!isTokenValid()) {
    logoutUser();
    window.location.href = '/';
    return false;
  }
  return true;
};

/**
 * Check if user has required role and redirect if not
 */
export const ensureAuthorized = (requiredRoles?: string[]): boolean => {
  if (!checkUserRole(requiredRoles)) {
    window.location.href = '/';
    return false;
  }
  return true;
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