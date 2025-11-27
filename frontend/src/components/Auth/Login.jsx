import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import authService from '../../services/authService';
import { validateEmail } from '../../utils/validation';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaParking, FaSpinner } from 'react-icons/fa';

/**
 * Login Component
 * Dedicated login page for visitors only
 * Members and watchmen should use /member-login
 * Admins should use /admin-login
 */
const Login = () => {
  const navigate = useNavigate();
  const { login: updateAuthContext } = useContext(AuthContext);

  // Form state management
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * Handle input changes - clear errors only
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  /**
   * Handle field blur - validate email when user leaves field
   */
  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    if (name === 'email' && value) {
      const emailValidation = validateEmail(value);
      if (!emailValidation.isValid) {
        setError(emailValidation.error);
      }
    }
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Validate form inputs
   */
  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Password is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('[LOGIN] Form submitted');
    
    // Clear previous messages
    setError(null);
    setSuccessMessage('');

    // Validate form
    if (!validateForm()) {
      console.log('[LOGIN] Validation failed');
      return;
    }

    setLoading(true);
    console.log('[LOGIN] Starting login request...');

    try {
      // Call login API with email
      const response = await authService.login(formData.email, formData.password);
      console.log('[LOGIN] Login successful:', response);
      
      // Verify user is visitor or walk_in
      if (response.user.user_type !== 'visitor' && response.user.user_type !== 'walk_in') {
        setError('Invalid credentials. Please use the correct login page for your account type.');
        setLoading(false);
        return;
      }

      // Update global auth context
      updateAuthContext(response.user, response.token);

      // Show success message
      setSuccessMessage('Login successful! Redirecting...');

      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (err) {
      console.log('[LOGIN] Login failed:', err);
      console.log('[LOGIN] Current formData before clear:', formData);
      
      // Handle login error - only clear password field, keep email
      const errorMessage = err.message || 'Login failed. Please check your email and password.';
      setError(errorMessage);
      
      // Only clear password field, preserve email
      const newFormData = {
        ...formData,
        password: ''
      };
      setFormData(newFormData);
      
      console.log('[LOGIN] Form data after password clear:', newFormData);
      console.error('Visitor login error:', err);
      
      // Explicitly stop here - no navigation
      console.log('[LOGIN] Staying on login page');
      setLoading(false);
      return;
    } finally {
      console.log('[LOGIN] Finally block executed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Branding */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-full shadow-lg">
              <FaParking className="text-white text-4xl" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome Back to ParkMitra
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your parking seamlessly
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8 space-y-6">
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md animate-fade-in">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-shake">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className={`text-gray-400 ${error && !formData.email ? 'text-red-400' : ''}`} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                    error && !formData.email
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className={`text-gray-400 ${error && !formData.password ? 'text-red-400' : ''}`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                    error && !formData.password
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-end">
              <Link
                to="#"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors opacity-50 cursor-not-allowed"
                onClick={(e) => e.preventDefault()}
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading || !formData.email || !formData.password}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-200 ${
                  loading || !formData.email || !formData.password
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-105'
                }`}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          {/* Additional Links */}
          <div className="mt-6 space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to ParkMitra?</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Link
                to="/register"
                className="w-full flex justify-center py-2 px-4 border border-indigo-300 rounded-lg text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 transition-all duration-200 transform hover:scale-105"
              >
                New Visitor? Register Here
              </Link>
              <Link
                to="/register-organization"
                className="w-full flex justify-center py-2 px-4 border border-purple-300 rounded-lg text-sm font-medium text-purple-600 bg-white hover:bg-purple-50 transition-all duration-200 transform hover:scale-105"
              >
                Register Your Organization
              </Link>
            </div>

            {/* Other Login Types */}
            <div className="relative mt-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Other Login Options</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 mt-3">
              <Link
                to="/member-login"
                className="w-full flex justify-center py-2 px-4 border border-blue-300 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100"
              >
                Member / Watchman Login
              </Link>
              <Link
                to="/admin-login"
                className="w-full flex justify-center py-2 px-4 border border-purple-300 rounded-lg text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Login;
