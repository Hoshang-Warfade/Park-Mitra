import React, { useContext } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaLock,
  FaArrowLeft,
  FaHome
} from 'react-icons/fa';

/**
 * ProtectedRoute Component
 * Handles authentication and authorization for protected routes
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Components to render if authorized
 * @param {string[]} props.allowedUserTypes - Array of user types allowed to access
 * @param {boolean} props.requiresAdmin - Requires organization admin access
 */
const ProtectedRoute = ({ 
  children, 
  allowedUserTypes = null, 
  requiresAdmin = false 
}) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * Check if user is authenticated
   */
  if (!isAuthenticated || !user) {
    // Store the attempted location for redirect after login
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }}
        replace 
      />
    );
  }

  /**
   * Check if user type is allowed
   */
  if (allowedUserTypes && allowedUserTypes.length > 0) {
    if (!allowedUserTypes.includes(user?.user_type)) {
      return (
        <AccessDenied
          message="You don't have permission to access this page"
          details={`This page is restricted to ${allowedUserTypes.map(type => 
            type.replace('_', ' ')
          ).join(', ')} users only.`}
          userType={user?.user_type}
          onGoBack={() => navigate(-1)}
          onGoHome={() => navigate('/dashboard')}
        />
      );
    }
  }

  /**
   * Check if admin access is required
   */
  if (requiresAdmin) {
    // Check if user is organization admin
    const isOrgAdmin = user?.user_type === 'admin' || user.is_admin === true;
    
    if (!isOrgAdmin) {
      return (
        <AccessDenied
          message="Admin Access Required"
          details="This page requires organization administrator privileges. Please contact your administrator if you believe you should have access."
          userType={user?.user_type}
          isAdminRequired={true}
          onGoBack={() => navigate(-1)}
          onGoHome={() => navigate('/dashboard')}
        />
      );
    }
  }

  /**
   * User is authenticated and authorized - render children
   */
  return <>{children}</>;
};

/**
 * AccessDenied Component
 * Displays when user doesn't have permission to access a route
 */
const AccessDenied = ({ 
  message, 
  details, 
  userType, 
  isAdminRequired = false,
  onGoBack,
  onGoHome
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 px-8 py-6">
            <div className="flex items-center justify-center">
              {isAdminRequired ? (
                <FaLock className="text-white text-6xl" />
              ) : (
                <FaShieldAlt className="text-white text-6xl" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-10 text-center">
            {/* Warning Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <FaExclamationTriangle className="text-red-600 text-4xl" />
            </div>

            {/* Main Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {message}
            </h1>

            {/* Details */}
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              {details}
            </p>

            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-8 inline-block">
              <p className="text-sm text-gray-500 mb-1">Your current role:</p>
              <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 font-semibold rounded-lg capitalize">
                {userType?.replace('_', ' ')}
              </span>
            </div>

            {/* Additional Info Box */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FaShieldAlt className="text-blue-600 text-2xl mt-1" />
                </div>
                <div className="ml-4 text-left">
                  <h3 className="text-sm font-bold text-blue-900 mb-2">
                    Need Access?
                  </h3>
                  <p className="text-sm text-blue-800">
                    If you believe you should have access to this page, please contact your 
                    organization administrator or system support team.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onGoBack}
                className="flex items-center justify-center px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-all"
              >
                <FaArrowLeft className="mr-2" />
                Go Back
              </button>

              <button
                onClick={onGoHome}
                className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                <FaHome className="mr-2" />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Need help? Visit our{' '}
            <a 
              href="/help" 
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Help & Support
            </a>{' '}
            page or contact support at{' '}
            <a 
              href="mailto:support@parkmitra.com" 
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              support@parkmitra.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;

