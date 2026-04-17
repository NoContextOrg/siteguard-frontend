import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardRoute } from '../api/auth';

interface RoleBasedRedirectProps {
  children?: React.ReactNode;
}

/**
 * Component that redirects authenticated users to their role-specific dashboard
 * Useful for automatic redirects after login or accessing root path
 */
export const RoleBasedRedirect: React.FC<RoleBasedRedirectProps> = ({ children }) => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      const dashboardRoute = getDashboardRoute();
      navigate(dashboardRoute, { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // If user is authenticated, redirect them (this component renders nothing)
  if (isAuthenticated && !loading) {
    return null;
  }

  // Otherwise render children (usually landing page)
  return <>{children}</>;
};

export default RoleBasedRedirect;