import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getUser, getUserAccessConfig, hasRole, hasAnyRole } from '../services/auth';

const ProtectedRoute = ({ children, requiredRole, requiredAnyRole }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const user = getUser();
  const { defaultRoute } = getUserAccessConfig(user);

  // Check if specific role is required
  if (requiredRole && !hasRole(requiredRole, user)) {
    console.log(`Access denied: required role ${requiredRole}, redirecting to ${defaultRoute}`);
    return <Navigate to={defaultRoute} replace />;
  }

  // Check if any of the roles is required
  if (requiredAnyRole && !hasAnyRole(requiredAnyRole, user)) {
    console.log(`Access denied: required any role in ${requiredAnyRole}, redirecting to ${defaultRoute}`);
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
};

export default ProtectedRoute;
