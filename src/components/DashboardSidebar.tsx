/**
 * Dashboard Sidebar Component
 * Reusable sidebar for all dashboards with navigation
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTabIcon } from '../config/sidebarConfig.tsx';
import type { NavItem } from '../config/sidebarConfig.tsx';

interface DashboardSidebarProps {
  navItems: NavItem[];
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * PURE Dashboard Sidebar - NO side effects on nav items
 * Only Link components for navigation
 * Only logout button has onClick handler
 */
export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ navItems, isOpen = false, onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen bg-slate-900 text-white transition-all duration-300 z-50 ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        } ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}`}
      >
      {/* Header - collapse button only */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed && <h2 className="text-xl font-bold">SiteGuard</h2>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-slate-800 rounded transition-colors flex-shrink-0"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronDown
            size={20}
            className={`transition-transform ${isCollapsed ? 'rotate-90' : '-rotate-90'}`}
          />
        </button>
      </div>

      {/* Navigation - ONLY Link components */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.id}
              to={item.path}
              className={
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ` +
                // Uniform look for ALL tabs; active only slightly highlighted
                (isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white')
              }
              title={item.label}
            >
              <div className="flex-shrink-0 w-5 h-5">{getTabIcon(item.iconType)}</div>
              {!isCollapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Logout - ONLY button with onClick */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800 hover:bg-red-600 transition-colors text-slate-300 hover:text-white"
          title="Logout"
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
    </>
  );
};
