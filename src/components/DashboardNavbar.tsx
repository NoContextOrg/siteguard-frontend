/**
 * Dashboard Navbar Component
 * Reusable navbar for all dashboards with user info and logout
 */

import React, { useState } from 'react';
import { Search, Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardNavbarProps {
  title: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({
  title,
  userName = 'User',
  userEmail = 'user@example.com',
  userAvatar = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
}) => {
  const { logout, userEmail: authEmail } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const displayEmail = userEmail || authEmail || 'user@example.com';
  const displayName = userName || displayEmail.split('@')[0];

  return (
    <header className="bg-[#1e3a8a] text-white h-16 flex items-center justify-between px-8 sticky top-0 z-30 shadow-lg">
      <div className="flex items-center gap-2">
        <div className="bg-white/10 p-1.5 rounded-lg border border-white/20">
          <Search size={20} />
        </div>
        <span className="text-xl font-bold uppercase tracking-widest">{title}</span>
      </div>

      <div className="flex items-center gap-6">
        <button className="hover:bg-white/10 p-2 rounded-lg transition">
          <Bell size={20} className="cursor-pointer" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 border-l border-white/20 pl-6 hover:bg-white/5 px-3 py-2 rounded-lg transition"
          >
            <div className="text-right">
              <p className="text-xs font-bold text-white">{displayName}</p>
              <p className="text-[12px] opacity-70">{displayEmail}</p>
            </div>
            <div className="w-10 h-10 bg-slate-300 rounded-full overflow-hidden border-2 border-white/50">
              <img src={userAvatar} alt={displayName} className="w-full h-full object-cover" />
            </div>
            <ChevronDown size={16} className={`transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700 bg-slate-800">
                <p className="text-sm font-semibold text-white">{displayName}</p>
                <p className="text-xs text-slate-400">{displayEmail}</p>
              </div>

              <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:bg-slate-800 transition">
                <User size={16} />
                <span className="text-sm">Profile</span>
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:bg-slate-800 transition">
                <Settings size={16} />
                <span className="text-sm">Settings</span>
              </button>

              <div className="border-t border-slate-700 my-1"></div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 transition"
              >
                <LogOut size={16} />
                <span className="text-sm font-semibold">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay to close menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </header>
  );
};
