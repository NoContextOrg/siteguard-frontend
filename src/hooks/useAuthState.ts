import { useEffect, useState } from 'react';
import { getAuthToken, isTokenValid, logoutUser } from '../api/auth';

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

      if (token && isValid) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        // Clear storage if token is invalid
        if (token && !isValid) {
          logoutUser();
        }
      }
      setLoading(false);
    };

    checkAuth();

    // Check auth state every 30 seconds
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
      // If accessToken is removed, user logged out
      if (e.key === 'accessToken' && e.newValue === null) {
        window.location.href = '/';
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
};