/**
 * Sidebar Configuration
 * Dynamic sidebar items based on user role
 * Ensures consistent navigation across all dashboards
 */

import React from 'react';
import { LayoutDashboard, Users, BellRing, Users2, User } from 'lucide-react';
import { getPrimaryRole } from '../api/auth';

// ========== Type Exports ==========
export type UserRole = 'admin' | 'engineer' | 'nurse' | 'staff' | 'worker';
export type SidebarIconType = 'dashboard' | 'workers' | 'alerts' | 'teams' | 'profile';

// ========== Interface Exports ==========
/**
 * Navigation item for sidebar (data-only; UI renders icons/styles)
 */
export interface NavItem {
  id: string;
  label: string;
  path: string;
  iconType: SidebarIconType;
}

/**
 * Sidebar tab definition
 */
export interface SidebarTab {
  id: string;
  label: string;
  iconType: SidebarIconType;
  path: string;
}

/**
 * Icon factory function - creates the appropriate icon based on type
 */
export const getTabIcon = (iconType: SidebarIconType): React.ReactNode => {
  switch (iconType) {
    case 'dashboard':
      return <LayoutDashboard size={20} />;
    case 'workers':
      return <Users size={20} />;
    case 'alerts':
      return <BellRing size={20} />;
    case 'teams':
      return <Users2 size={20} />;
    case 'profile':
      return <User size={20} />;
    default:
      return <Users size={20} />;
  }
};

/**
 * Tab definitions - the master list of all available tabs
 */
export const TAB_DEFINITIONS: Record<string, SidebarTab> = {
  DASHBOARD: {
    id: 'dashboard',
    label: 'Dashboard',
    iconType: 'dashboard',
    path: '/dashboard', // Will be replaced by role-specific path
  },
  WORKERS: {
    id: 'workers',
    label: 'Workers',
    iconType: 'workers',
    path: '/workers',
  },
  ALERTS: {
    id: 'alerts',
    label: 'Alerts',
    iconType: 'alerts',
    path: '/alerts',
  },
  TEAMS: {
    id: 'teams',
    label: 'Teams',
    iconType: 'teams',
    path: '/teams',
  },
  PROFILE: {
    id: 'profile',
    label: 'Profile',
    iconType: 'profile',
    path: '/worker_profile',
  },
};

/**
 * Role-specific tab configuration
 * Defines which tabs each role can access and in what order
 */
export const ROLE_TAB_CONFIG: Record<UserRole, string[]> = {
  admin: ['DASHBOARD', 'WORKERS', 'ALERTS', 'TEAMS'],
  engineer: ['DASHBOARD', 'WORKERS', 'ALERTS', 'TEAMS'],
  nurse: ['DASHBOARD', 'WORKERS', 'ALERTS'],
  staff: ['DASHBOARD', 'WORKERS', 'ALERTS'],
  worker: ['DASHBOARD', 'PROFILE'],
};

/**
 * Role-specific path overrides
 * Maps tab IDs to role-specific routes
 */
export const ROLE_PATH_OVERRIDES: Record<UserRole, Record<string, string>> = {
  admin: {
    DASHBOARD: '/admin_dashboard',
    WORKERS: '/workers',
    ALERTS: '/alerts',
    TEAMS: '/admin_team',
  },
  engineer: {
    DASHBOARD: '/engineer_dashboard',
    WORKERS: '/workers',
    TEAMS: '/engineer_team',
  },
  nurse: {
    DASHBOARD: '/nurse_dashboard',
    WORKERS: '/workers',
  },
  staff: {
    DASHBOARD: '/nurse_dashboard',
    WORKERS: '/workers',
  },
  worker: {
    DASHBOARD: '/worker_landing',
    PROFILE: '/worker_profile',
  },
};

/**
 * Get sidebar tabs for a specific role
 * Returns the complete sidebar configuration with correct paths for that role
 */
export const getSidebarTabsForRole = (role: UserRole | null): SidebarTab[] => {
  // If no role is provided, return empty array
  if (!role) return [];

  // Normalize role to lowercase
  const normalizedRole = role.toLowerCase() as UserRole;
  
  const tabIds = ROLE_TAB_CONFIG[normalizedRole] || [];
  const pathOverrides = ROLE_PATH_OVERRIDES[normalizedRole] || {};

  return tabIds
    .map((tabId) => {
      const tabDef = TAB_DEFINITIONS[tabId];
      if (!tabDef) return null;

      return {
        ...tabDef,
        path: pathOverrides[tabId] || tabDef.path,
      };
    })
    .filter((tab): tab is SidebarTab => tab !== null);
};

/**
 * Map SidebarTab objects to NavItem format for DashboardSidebar
 * Data-only: NO React nodes, NO handlers
 */
export const mapTabsToNavItems = (tabs: SidebarTab[]): NavItem[] =>
  tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    path: tab.path,
    iconType: tab.iconType,
  }));

/**
 * Get sidebar tabs from localStorage roles
 * Convenience function to get tabs based on stored user roles
 */
export const getSidebarTabsFromStorage = (): SidebarTab[] => {
  try {
    const rolesJson = localStorage.getItem('userRoles');
    if (!rolesJson) return [];

    const roles = JSON.parse(rolesJson) as string[];
    if (!roles || roles.length === 0) return [];

    // Extract role name from "ROLE_ADMIN" format
    const primaryRole = roles[0]
      .replace('ROLE_', '')
      .toLowerCase() as UserRole;

    return getSidebarTabsForRole(primaryRole);
  } catch {
    return [];
  }
};

/**
 * Validate if a user can access a specific tab
 */
export const canAccessTab = (role: UserRole, tabId: string): boolean => {
  const tabIds = ROLE_TAB_CONFIG[role] || [];
  return tabIds.includes(tabId);
};

/**
 * Get all tabs for a role (for debugging/admin purposes)
 */
export const getAllTabsForRole = (role: UserRole): string => {
  const tabIds = ROLE_TAB_CONFIG[role] || [];
  return tabIds
    .map((id) => TAB_DEFINITIONS[id]?.label)
    .filter(Boolean)
    .join(', ');
};

/**
 * Check if user role is valid
 */
export const isValidRole = (role: string | null): role is UserRole => {
  if (!role) return false;
  return ['admin', 'engineer', 'nurse', 'staff', 'worker'].includes(role.toLowerCase());
};

/**
 * Get role with validation
 */
export const getRoleWithValidation = (): UserRole | null => {
  const role = getPrimaryRole();
  if (isValidRole(role)) return role as UserRole;
  return null;
};

/**
 * Get sidebar tabs for the current user based on role check
 * This is the primary function to use in components
 */
export const getCurrentUserSidebarTabs = (): SidebarTab[] => {
  // Get role from storage
  const role = getPrimaryRole();
  
  // Check if role is valid
  if (!isValidRole(role)) {
    console.warn('Invalid or missing role:', role);
    return [];
  }

  // Return tabs for the validated role
  return getSidebarTabsForRole(role);
};

// Ensure NavItem remains a stable named export for type-only imports
export type SidebarNavItem = NavItem;
