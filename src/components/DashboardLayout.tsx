import React from 'react';
import type { ReactNode } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import DashboardNavbar from './DashboardNavbar';
import { useSidebarTabs } from '../hooks/useSidebarTabs';
import { mapTabsToNavItems } from '../config/sidebarConfig.tsx';
import { getPrimaryRole } from '../api/auth';
import { useAuth } from '../context/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  title = 'Dashboard'
}) => {
  const { isAuthenticated, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const userRole = getPrimaryRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600 text-lg mb-4">Your session has expired. Please log in again.</p>
          <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">Return to Home</a>
        </div>
      </div>
    );
  }

  const sidebarTabs = useSidebarTabs();
  const sidebarItems = mapTabsToNavItems(sidebarTabs);
  const formattedTitle = title.includes('-')
    ? title
    : `${title}${userRole ? ' - ' + userRole.charAt(0).toUpperCase() + userRole.slice(1) : ''}`;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans overflow-x-hidden">
      <DashboardSidebar 
        navItems={sidebarItems} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      <main className="flex-1 md:ml-64 transition-all duration-300 w-full min-w-0">
        <DashboardNavbar 
          title={formattedTitle} 
          onMenuClick={() => setIsSidebarOpen(true)} 
        />
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;