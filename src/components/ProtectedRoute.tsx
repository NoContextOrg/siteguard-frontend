/**
 * Protected Route Component
 * Guards routes that require authentication and optionally specific roles
 */

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPrimaryRole } from '../api/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

/**
 * Route protection component that checks authentication and authorization
 * Does NOT cause logout on role mismatch - just redirects
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles 
}) => {
  const { isAuthenticated, loading } = useAuth();

  console.log('🛡️ ProtectedRoute check:', {
    isAuthenticated,
    loading,
    requiredRoles
  });

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
    console.warn('⚠️ ProtectedRoute: Not authenticated, redirecting to home');
    return <Navigate to="/" replace />;
  }

  // If no roles are required, grant access
  if (!requiredRoles || requiredRoles.length === 0) {
    console.log('✅ ProtectedRoute: Access granted (no roles required)');
    return <>{children}</>;
  }

  // Check for roles
  const userRole = getPrimaryRole();
  const hasRequiredRole = requiredRoles.some(
    role => userRole && role.toLowerCase() === userRole.toLowerCase()
  );

  if (hasRequiredRole) {
    console.log('✅ ProtectedRoute: Access granted (role match)');
    return <>{children}</>;
  }

  // Has role restriction but user doesn't have required role - redirect to their dashboard
  console.warn('⚠️ ProtectedRoute: User lacks required role, redirecting to dashboard');
  return <Navigate to="/dashboard" replace />;
};
