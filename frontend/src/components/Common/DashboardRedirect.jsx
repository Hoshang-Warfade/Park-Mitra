import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

/**
 * DashboardRedirect Component
 * Redirects users to appropriate dashboard based on their user type
 */
const DashboardRedirect = () => {
  const { user } = useContext(AuthContext);

  // Redirect based on user type
  if (user?.user_type === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (user?.user_type === 'watchman') {
    return <Navigate to="/watchman/dashboard" replace />;
  } else {
    // Regular users (organization_member, visitor, walk_in)
    return <Navigate to="/user/dashboard" replace />;
  }
};

export default DashboardRedirect;
