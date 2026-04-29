/**
 * Auth Context
 * Manages authentication state globally across the app
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  getDashboardRoute,
} from '../api/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  userId: number | null;
  personCode: string | null;
  roles: string[];
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [personCode, setPersonCode] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication on mount and redirect if necessary
  useEffect(() => {
    const checkAuthentication = async () => {
      setLoading(true);
      try {
        const token = getAuthToken();
        if (token && checkAuth()) {
          const isValid = await verifyToken(token);
          if (isValid) {
            setIsAuthenticated(true);
            const email = getStoredUserEmail();
            const userRoles = getUserRoles();
            setUserEmail(email);
            setRoles(userRoles);
            
            const storedUserId = localStorage.getItem('userId');
            const storedPersonCode = localStorage.getItem('personCode');
            if (storedUserId) setUserId(Number(storedUserId));
            if (storedPersonCode) setPersonCode(storedPersonCode);
          } else {
            logoutUser();
            setIsAuthenticated(false);
          }
        } else {
          // No valid token, stay on landing page
          setIsAuthenticated(false);
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

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loginUser({ email, password, rememberMe });
      storeAuthData(response, rememberMe);
      setIsAuthenticated(true);
      setUserEmail(response.username);
      setRoles(response.roles);
      
      // Store userDetails in state and localStorage
      const userDetails = (response as any).userDetails;
      if (userDetails) {
        setUserId(userDetails.id);
        setPersonCode(userDetails.personCode);
        localStorage.setItem('userId', String(userDetails.id));
        localStorage.setItem('personCode', userDetails.personCode);
      }
      
      // Store roles in localStorage for sidebar configuration
      localStorage.setItem('userRoles', JSON.stringify(response.roles));
      
      // Redirect to appropriate dashboard based on role
      const dashboardRoute = getDashboardRoute();
      navigate(dashboardRoute, { replace: true });
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
    setUserId(null);
    setPersonCode(null);
    setRoles([]);
    setError(null);
    localStorage.removeItem('userId');
    localStorage.removeItem('personCode');
    navigate('/', { replace: true });
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userEmail,
        userId,
        personCode,
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
