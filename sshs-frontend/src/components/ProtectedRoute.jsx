import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show a loading state while the auth check is happening
  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-sshs-dark text-white">Loading...</div>;
  }

  // 1. Check Authentication
  // If not logged in, send to Login page
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check Role Permission (If defined)
  // If logged in but wrong role, send to 404 (Not Found) instead of Dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/404" replace />;
  }

  return children;
};

export default ProtectedRoute;