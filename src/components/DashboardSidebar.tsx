/**
 * Dashboard Sidebar Component
 * Reusable sidebar for all dashboards with navigation
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path?: string;
  onClick?: () => void;
}

interface DashboardSidebarProps {
  navItems: NavItem[];
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ navItems }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="w-64 bg-[#1e293b] text-white flex flex-col fixed h-full z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-white p-1 rounded-lg">
          <ShieldAlert className="text-blue-600 w-6 h-6" />
        </div>
        <span className="text-xl font-bold tracking-tight">SiteGuard</span>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item, index) => {
          const isActive = item.path && location.pathname === item.path;
          const handleClick = () => {
            if (item.path) {
              navigate(item.path);
            } else if (item.onClick) {
              item.onClick();
            }
          };

          return (
            <button
              key={index}
              onClick={handleClick}
              className={`flex items-center gap-4 w-full px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="text-sm font-semibold uppercase">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
