/**
 * Navigation Utilities
 * Provides role-based navigation items for consistent sidebars across all dashboards
 */

import React from 'react';

export interface NavItem {
  icon: React.ReactNode;
  label: string;
  path?: string;
  onClick?: () => void;
  badge?: number | string;
}

export type UserRole = 'admin' | 'engineer' | 'nurse' | 'staff';

/**
 * Get navigation items based on user role
 * Ensures consistent navigation across all dashboards
 */
export const getNavItemsByRole = (role: UserRole): NavItem[] => {
  switch (role) {
    case 'admin':
      return [
        {
          icon: React.createElement('div'), // Will be replaced with icon component
          label: 'Dashboard',
          path: '/admin_dashboard',
        },
        {
          icon: React.createElement('div'),
          label: 'Workers',
          path: '/workers',
        },
        {
          icon: React.createElement('div'),
          label: 'Teams',
          path: '/admin_team',
        },
        {
          icon: React.createElement('div'),
          label: 'Attendance',
          path: '/attendance',
        },
        {
          icon: React.createElement('div'),
          label: 'Alerts',
          path: '/alerts',
        },
        {
          icon: React.createElement('div'),
          label: 'Persons',
          path: '/persons',
        },
      ];

    case 'engineer':
      return [
        {
          icon: React.createElement('div'),
          label: 'Dashboard',
          path: '/engineer_dashboard',
        },
        {
          icon: React.createElement('div'),
          label: 'Workers',
          path: '/workers',
        },
        {
          icon: React.createElement('div'),
          label: 'Team',
          path: '/engineer_team',
        },
      ];

    case 'nurse':
    case 'staff':
    default:
      return [
        {
          icon: React.createElement('div'),
          label: 'Dashboard',
          path: '/nurse_dashboard',
        },
        {
          icon: React.createElement('div'),
          label: 'Workers',
          path: '/workers',
        },
      ];
  }
};

/**
 * Get navigation items for a specific dashboard
 * Used when icons need to be properly passed from the component
 */
export const buildNavItems = (
  baseItems: Array<{ label: string; path?: string; badge?: number | string }>,
  icons: React.ReactNode[]
): NavItem[] => {
  return baseItems.map((item, index) => ({
    ...item,
    icon: icons[index] || null,
  }));
};

/**
 * Determine if user can access a route based on role
 */
export const canAccessRoute = (role: UserRole, path: string): boolean => {
  const adminRoutes = ['/admin_dashboard', '/admin_team', '/admin_team_detail', '/attendance', '/alerts', '/persons', '/teams'];
  const engineerRoutes = ['/engineer_dashboard', '/engineer_team'];
  const nurseRoutes = ['/nurse_dashboard', '/dashboard'];
  const allRoles = ['/workers', '/worker-profile'];

  switch (role) {
    case 'admin':
      return adminRoutes.includes(path) || allRoles.includes(path);
    case 'engineer':
      return engineerRoutes.includes(path) || allRoles.includes(path);
    case 'nurse':
    case 'staff':
      return nurseRoutes.includes(path) || allRoles.includes(path);
    default:
      return allRoles.includes(path);
  }
};

/**
 * Get dashboard breadcrumb based on current path
 */
export const getBreadcrumb = (path: string): string => {
  const breadcrumbs: Record<string, string> = {
    '/admin_dashboard': 'Admin Dashboard',
    '/admin_team': 'Teams',
    '/admin_team_detail': 'Team Details',
    '/engineer_dashboard': 'Engineer Dashboard',
    '/engineer_team': 'Team',
    '/nurse_dashboard': 'Nurse Dashboard',
    '/dashboard': 'Dashboard',
    '/workers': 'Workers',
    '/worker-profile': 'Worker Profile',
    '/attendance': 'Attendance',
    '/alerts': 'Alerts',
    '/persons': 'Persons',
    '/teams': 'Teams',
  };

  return breadcrumbs[path] || 'Dashboard';
};
