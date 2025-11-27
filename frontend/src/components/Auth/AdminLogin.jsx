import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import authService from '../../services/authService';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaSpinner } from 'react-icons/fa';

/**
 * Admin Login Component
 * Dedicated login page for organization administrators
 */
const AdminLogin = () => {
  const navigate = useNavigate();
  const { login: updateAuthContext } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await authService.login(formData.email, formData.password);
      
      // Verify user is admin
      if (response.user.user_type !== 'admin') {
        setError('Access denied. This login is for administrators only.');
        setLoading(false);
        return;
      }

      updateAuthContext(response.user, response.token);
      navigate('/admin/dashboard');

    } catch (err) {
      const errorMessage = err.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      
      // Only clear password field, preserve email
      setFormData(prev => ({
        ...prev,
        password: ''
      }));
      
      console.error('Admin login error:', err);
      
      // Explicitly return to prevent any further execution
      return;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Branding */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-full shadow-2xl">
              <FaShieldAlt className="text-white text-4xl" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Admin Portal
          </h2>
          <p className="mt-2 text-sm text-purple-200">
            Organization Administrator Login
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="admin@organization.com"
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
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign In as Admin'
              )}
            </button>
          </form>

          {/* Other Login Options */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-4">Not an admin?</p>
            <div className="space-y-2">
              <Link
                to="/member-login"
                className="block w-full py-2 px-4 border border-indigo-300 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
              >
                Member/Watchman Login
              </Link>
              <Link
                to="/login"
                className="block w-full py-2 px-4 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
              >
                Visitor Login
              </Link>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link to="/" className="text-sm text-purple-200 hover:text-white">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
