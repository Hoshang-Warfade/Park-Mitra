import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import authService from '../../services/authService';
import organizationService from '../../services/organizationService';
import { FaIdCard, FaLock, FaEye, FaEyeSlash, FaUserTie, FaSpinner, FaBuilding } from 'react-icons/fa';

/**
 * Member/Watchman Login Component
 * Dedicated login page for organization members and watchmen
 * Login using Employee ID (not email)
 * Step 1: Select Organization
 * Step 2: Enter Employee ID and Password
 */
const MemberLogin = () => {
  const navigate = useNavigate();
  const { login: updateAuthContext, isAuthenticated, user } = useContext(AuthContext);

  const [step, setStep] = useState(1); // 1: Select Organization, 2: Login
  const [organizations, setOrganizations] = useState([]);
  const [formData, setFormData] = useState({
    organization_id: '',
    employee_id: '',
    password: ''
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Fetch organizations on component mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoadingOrgs(true);
        const organizations = await organizationService.getAllOrganizations();
        console.log('Fetched organizations:', organizations);
        setOrganizations(organizations || []);
      } catch (err) {
        console.error('Failed to fetch organizations:', err);
        setError('Failed to load organizations. Please refresh the page.');
      } finally {
        setLoadingOrgs(false);
      }
    };

    fetchOrganizations();
  }, []);

  // Handle navigation after authentication state updates
  useEffect(() => {
    if (isAuthenticated && user && pendingNavigation) {
      navigate(pendingNavigation, { replace: true });
      setPendingNavigation(null);
    }
  }, [isAuthenticated, user, pendingNavigation, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const validateForm = () => {
    // Step 1: Validate organization selection
    if (step === 1) {
      if (!formData.organization_id) {
        setError('Please select your organization');
        return false;
      }
      return true;
    }

    // Step 2: Validate credentials
    if (!formData.organization_id) {
      setError('Organization is required');
      return false;
    }
    if (!formData.employee_id.trim()) {
      setError('Employee ID is required');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Password is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Step 1: Move to credentials step after selecting organization
    if (step === 1) {
      setStep(2);
      setError(null);
      return;
    }

    // Step 2: Perform login
    setLoading(true);

    try {
      // Login with employee_id and organization_id
      const response = await authService.login(
        formData.employee_id, 
        formData.password,
        formData.organization_id
      );
      
      // Verify user is member or watchman
      if (response.user.user_type !== 'organization_member' && response.user.user_type !== 'watchman') {
        setError('Invalid credentials. Please use the correct login page.');
        setLoading(false);
        return;
      }

      // Update authentication context
      updateAuthContext(response.user, response.token);

      // Set pending navigation based on user type
      // The useEffect will handle actual navigation once state updates
      const targetRoute = response.user.user_type === 'watchman' 
        ? '/watchman/dashboard' 
        : '/dashboard';
      
      setPendingNavigation(targetRoute);

    } catch (err) {
      const errorMessage = err.message || 'Login failed. Please check your Employee ID and password.';
      setError(errorMessage);
      
      // Only clear password field, preserve organization and employee_id
      setFormData(prev => ({
        ...prev,
        password: ''
      }));
      
      console.error('Member login error:', err);
      
      // Explicitly return to prevent any further execution
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setError(null);
    setFormData(prev => ({ ...prev, employee_id: '', password: '' }));
  };

  const getSelectedOrganization = () => {
    return organizations.find(org => org.id === parseInt(formData.organization_id));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Branding */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-cyan-400 to-blue-500 p-4 rounded-full shadow-2xl">
              <FaUserTie className="text-white text-4xl" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Member & Watchman Portal
          </h2>
          <p className="mt-2 text-sm text-blue-100">
            Login with your Employee ID
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8 space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Organization</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Login</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
            <p className="text-sm text-blue-700">
              {step === 1 ? (
                <>
                  <strong>Step 1:</strong> Select your organization to continue
                </>
              ) : (
                <>
                  <strong>Step 2:</strong> Use the Employee ID provided by your organization admin, not your email address.
                </>
              )}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Step 1: Organization Selection */}
            {step === 1 && (
              <div>
                <label htmlFor="organization_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Your Organization *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaBuilding className="text-gray-400" />
                  </div>
                  <select
                    id="organization_id"
                    name="organization_id"
                    required
                    value={formData.organization_id}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    disabled={loadingOrgs}
                  >
                    <option value="">-- Select Organization --</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.org_name}
                      </option>
                    ))}
                  </select>
                </div>
                {loadingOrgs && (
                  <p className="mt-2 text-xs text-gray-500 flex items-center">
                    <FaSpinner className="animate-spin mr-2" />
                    Loading organizations...
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Select the organization where you are employed
                </p>
              </div>
            )}

            {/* Step 2: Credentials */}
            {step === 2 && (
              <>
                {/* Selected Organization Display */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Selected Organization</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {getSelectedOrganization()?.org_name || 'Unknown'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleBack}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* Employee ID Input */}
                <div>
                  <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaIdCard className="text-gray-400" />
                    </div>
                    <input
                      id="employee_id"
                      name="employee_id"
                      type="text"
                      autoComplete="username"
                      required
                      value={formData.employee_id}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., EMP001 or WM001"
                      disabled={loading}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Example: EMP001 (member) or WM001 (watchman)
                  </p>
                </div>
              </>
            )}

            {/* Password Input - Only in Step 2 */}
            {step === 2 && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
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
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (step === 1 && loadingOrgs)}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Signing in...
                </>
              ) : step === 1 ? (
                'Continue'
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 mb-4">
              Don't have credentials? Contact your organization administrator.
            </p>
            <div className="space-y-2">
              <Link
                to="/admin-login"
                className="block w-full py-2 px-4 border border-purple-300 rounded-lg text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100"
              >
                Admin Login
              </Link>
              <Link
                to="/login"
                className="block w-full py-2 px-4 border border-green-300 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100"
              >
                Visitor Login
              </Link>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link to="/" className="text-sm text-blue-100 hover:text-white">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MemberLogin;
