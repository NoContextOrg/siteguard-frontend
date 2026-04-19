import { useEffect, useState } from 'react';
import { getAuthToken, isTokenValid } from '../api/auth';

/**
 * Hook to check if user is authenticated and token is valid
 * Works outside of AuthContext
 */
export const useAuthState = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = getAuthToken();
      const isValid = isTokenValid();

      setIsAuthenticated(Boolean(token && isValid));
      setLoading(false);
    };

    checkAuth();

    // Keep light polling but DO NOT perform side-effects (logout/redirect)
    const interval = setInterval(checkAuth, 30000);

    return () => clearInterval(interval);
  }, []);

  return { isAuthenticated, loading };
};

/**
 * Hook to sync auth state across tabs/windows
 */
export const useSyncAuth = () => {
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // If accessToken is removed in another tab, do not hard-redirect.
      // Pages/routes should handle auth state.
      if (e.key === 'accessToken' && e.newValue === null) {
        // no-op
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
};