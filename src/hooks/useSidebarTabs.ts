/**
 * Hook to get consistent sidebar tabs based on user role
 * Ensures the same tabs appear across all dashboards for the same user role
 */

import { useMemo, useState, useEffect } from 'react';
import { getCurrentUserSidebarTabs } from '../config/sidebarConfig.tsx';

/**
 * Hook to get sidebar tabs for the current user
 * Returns the same tabs regardless of which page the user navigates to
 * Dynamically renders based on user role stored in localStorage
 */
export const useSidebarTabs = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Listen for storage changes to update sidebar
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('📱 Storage changed, updating sidebar tabs');
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const sidebarTabs = useMemo(() => {
    console.log('🔄 Computing sidebar tabs');
    return getCurrentUserSidebarTabs();
  }, [refreshTrigger]);

  return sidebarTabs;
};
