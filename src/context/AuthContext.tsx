/**
 * Auth Context
 * Manages authentication state globally across the app
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { 
  loginUser, 
  logoutUser, 
  isAuthenticated as checkAuth,
  getStoredUserEmail,
  getUserRoles,
  storeAuthData,
  verifyToken,
  getAuthToken,
} from '../api/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  roles: string[];
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuthentication = async () => {
      setLoading(true);
      try {
        const token = getAuthToken();
        if (token && checkAuth()) {
          const isValid = await verifyToken(token);
          if (isValid) {
            setIsAuthenticated(true);
            setUserEmail(getStoredUserEmail());
            setRoles(getUserRoles());
          } else {
            logoutUser();
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        logoutUser();
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loginUser({ email, password });
      storeAuthData(response);
      setIsAuthenticated(true);
      setUserEmail(response.username);
      setRoles(response.roles);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    logoutUser();
    setIsAuthenticated(false);
    setUserEmail(null);
    setRoles([]);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userEmail,
        roles,
        loading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
