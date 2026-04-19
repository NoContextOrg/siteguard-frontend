import React from 'react';
import type { ReactNode } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import DashboardNavbar from './DashboardNavbar';
import { useSidebarTabs } from '../hooks/useSidebarTabs';
import { mapTabsToNavItems } from '../config/sidebarConfig.tsx';
import { getPrimaryRole, isTokenValid } from '../api/auth';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

/**
 * Standard Dashboard Layout Component
 * Includes uniform navbar and dynamic sidebar for all dashboard pages
 * Ensures consistent navigation across all dashboards
 * NOTE: Role checking is handled by ProtectedRoute, not here
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  title = 'Dashboard'
}) => {
  // Only validate token, not role (ProtectedRoute handles role validation)
  const isValid = isTokenValid();
  const userRole = getPrimaryRole();
  
  console.log('🏠 DashboardLayout rendered:', {
    isValid,
    userRole,
    title
  });
  
  // If token is invalid, show session expired message
  if (!isValid) {
    console.error('❌ Token invalid in DashboardLayout');
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600 text-lg mb-4">
            Your session has expired. Please log in again.
          </p>
          <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  // If no role found, something is wrong - redirect to login
  if (!userRole) {
    console.error('❌ No user role in DashboardLayout');
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600 text-lg mb-4">
            Unable to determine user role. Please log in again.
          </p>
          <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  // Get sidebar tabs based on user role
  const sidebarTabs = useSidebarTabs();
  const sidebarItems = mapTabsToNavItems(sidebarTabs);
  
  // Format title with role
  const formattedTitle = title.includes('-') 
    ? title 
    : `${title}${userRole ? ' - ' + userRole.charAt(0).toUpperCase() + userRole.slice(1) : ''}`;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Dynamic Sidebar - shows tabs based on role */}
      <DashboardSidebar navItems={sidebarItems} />

      {/* Main Content Area */}
      <main className="flex-1 ml-64">
        {/* Uniform Navbar - same across all pages */}
        <DashboardNavbar title={formattedTitle} />

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;