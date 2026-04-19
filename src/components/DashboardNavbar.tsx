/**
 * Dashboard Navbar Component
 * Reusable navbar for all dashboards with user info and logout
 */

import React, { useMemo, useState } from 'react';
import { Search, Bell, ChevronDown, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAuthToken, getPrimaryRole, getStoredUserEmail, logoutUser } from '../api/auth';

interface DashboardNavbarProps {
  title: string;
  /** Optional overrides; if omitted, navbar uses stored login data */
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

type JwtPayloadLike = {
  sub?: string;
  email?: string;
  username?: string;
  preferred_username?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
};

const safeDecodeJwtPayload = (token: string | null): JwtPayloadLike | null => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json) as JwtPayloadLike;
  } catch {
    return null;
  }
};

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({
  title,
  userName,
  userEmail,
  userAvatar = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
}) => {
  const { logout, userEmail: authEmail } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Use shared logout util for consistent storage clearing
    logoutUser();

    // Call context logout
    logout();

    // Navigate to landing page
    navigate('/', { replace: true });
  };

  const { displayEmail, displayName } = useMemo(() => {
    // Priority order:
    // 1) Explicit props (caller override)
    // 2) AuthContext
    // 3) localStorage saved on login (storeAuthData uses `username` in `userEmail` key)
    // 4) JWT payload

    const token = getAuthToken();
    const jwt = safeDecodeJwtPayload(token);

    const storedLoginEmailish = getStoredUserEmail();

    const resolvedEmail =
      userEmail ||
      authEmail ||
      storedLoginEmailish ||
      jwt?.email ||
      jwt?.preferred_username ||
      jwt?.username ||
      jwt?.sub ||
      'user@example.com';

    const resolvedName =
      userName ||
      jwt?.name ||
      [jwt?.given_name, jwt?.family_name].filter(Boolean).join(' ') ||
      resolvedEmail.split('@')[0] ||
      'User';

    return {
      displayEmail: resolvedEmail,
      displayName: resolvedName,
    };
  }, [userEmail, userName, authEmail]);

  // Get user role information
  const userRole = getPrimaryRole();

  return (
    <header className="bg-[#1e3a8a] text-white h-16 flex items-center justify-between px-8 sticky top-0 z-30 shadow-lg">
      <div className="flex items-center gap-2">
        <div className="bg-white/10 p-1.5 rounded-lg border border-white/20">
          <Search size={20} />
        </div>
        <span className="text-xl font-bold uppercase tracking-widest">{title}</span>
      </div>

      <div className="flex items-center gap-6">
        <button className="hover:bg-white/10 p-2 rounded-lg transition" type="button">
          <Bell size={20} className="cursor-pointer" />
        </button>

        <div className="relative">
          <button
            type="button"
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
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700 bg-slate-800">
                <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                <p className="text-xs text-slate-400 truncate">{displayEmail}</p>
              </div>

              <div className="px-4 py-3 space-y-3">
                {/* Role Badge */}
                {userRole && (
                  <div className="inline-flex px-3 py-1 bg-slate-700 text-slate-100 text-xs font-medium rounded-full">
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </div>
                )}

                {/* Profile (display-only) */}
                <div className="flex items-center gap-2 text-slate-200">
                  <User size={16} />
                  <span className="text-sm font-medium truncate">{displayEmail}</span>
                </div>
              </div>

              <div className="border-t border-slate-700" />

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 text-slate-200 hover:text-white p-3 hover:bg-slate-800"
              >
                <LogOut size={16} />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay to close menu */}
      {showUserMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
      )}
    </header>
  );
};

export default DashboardNavbar;
