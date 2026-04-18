/**
 * Protected Route Component
 * Guards routes that require authentication and optionally specific roles
 */

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardRoute } from '../api/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles 
}) => {
  const { isAuthenticated, roles, loading } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated && requiredRoles && requiredRoles.length > 0) {
      const userHasRole = requiredRoles.some(requiredRole =>
        roles.some(userRole => userRole.toUpperCase().includes(requiredRole.toUpperCase()))
      );
      setHasAccess(userHasRole);
    }
  }, [isAuthenticated, roles, requiredRoles, loading]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to landing page
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Has required roles or no specific roles required
  if (!requiredRoles || requiredRoles.length === 0 || hasAccess) {
    return <>{children}</>;
  }

  // Has role restriction but user doesn't have required role - redirect to their dashboard
  const userDashboard = getDashboardRoute();
  return <Navigate to={userDashboard} replace />;
};
