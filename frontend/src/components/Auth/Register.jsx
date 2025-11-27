import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import { validateEmail, validateMobile, validatePassword } from '../../utils/validation';
import { 
  FaUser, 
  FaEnvelope, 
  FaMobileAlt, 
  FaLock, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaEye, 
  FaEyeSlash, 
  FaUserPlus, 
  FaSpinner,
  FaInfoCircle
} from 'react-icons/fa';

/**
 * Register Component
 * Handles user registration with comprehensive validation
 * ONLY for visitors - Organization members and watchmen are added by admin
 */
const Register = () => {
  const navigate = useNavigate();

  // Form state management
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    user_type: 'visitor' // Fixed to visitor only
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  /**
   * Check if form is ready to submit (all fields valid)
   */
  const isFormValid = () => {
    return (
      formData.name.trim().length >= 2 &&
      validateEmail(formData.email).isValid &&
      validateMobile(formData.mobile).isValid &&
      validatePassword(formData.password).isValid &&
      formData.password === formData.confirmPassword &&
      Object.keys(errors).length === 0
    );
  };

  /**
   * Calculate password strength
   */
  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    
    const validation = validatePassword(password);
    
    if (!validation.isValid) {
      if (password.length < 8) {
        return { strength: 25, label: 'Weak', color: 'bg-red-500' };
      }
      return { strength: 50, label: 'Fair', color: 'bg-orange-500' };
    }
    
    // Use the strength from validation
    if (validation.strength === 'strong') {
      return { strength: 100, label: 'Strong', color: 'bg-green-500' };
    } else if (validation.strength === 'medium') {
      return { strength: 75, label: 'Good', color: 'bg-yellow-500' };
    } else {
      return { strength: 50, label: 'Fair', color: 'bg-orange-500' };
    }
  };

  /**
   * Validate entire form
   */
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }

    // Mobile validation
    const mobileValidation = validateMobile(formData.mobile);
    if (!mobileValidation.isValid) {
      newErrors.mobile = mobileValidation.error;
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle input changes - only clear errors, don't validate yet
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Clear API error when user makes changes
    if (apiError) {
      setApiError('');
    }
  };

  /**
   * Handle field blur - validate when user leaves field
   */
  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate the field
    const newErrors = { ...errors };

    if (name === 'email' && value) {
      const emailValidation = validateEmail(value);
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.error;
      } else {
        delete newErrors.email;
      }
    } else if (name === 'mobile' && value) {
      const mobileValidation = validateMobile(value);
      if (!mobileValidation.isValid) {
        newErrors.mobile = mobileValidation.error;
      } else {
        delete newErrors.mobile;
      }
    } else if (name === 'name' && value) {
      if (!value.trim()) {
        newErrors.name = 'Full name is required';
      } else if (value.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      } else {
        delete newErrors.name;
      }
    } else if (name === 'password' && value) {
      const passwordValidation = validatePassword(value);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.error;
      } else {
        delete newErrors.password;
      }
    } else if (name === 'confirmPassword' && value) {
      if (!value) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== value) {
        newErrors.confirmPassword = 'Passwords do not match';
      } else {
        delete newErrors.confirmPassword;
      }
    }

    setErrors(newErrors);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous API error
    setApiError('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registrationData } = formData;

      // Call register API
      await authService.register(registrationData);

      // Set success state
      setRegistrationSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      // Handle registration error
      setApiError(error.message || 'Registration failed. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Calculate password strength
  const passwordStrength = getPasswordStrength(formData.password);

  // Check if passwords match
  const passwordsMatch = formData.password && formData.confirmPassword && 
                         formData.password === formData.confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-full shadow-lg">
              <FaUserPlus className="text-white text-4xl" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create Your ParkMitra Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join us to experience seamless parking management
          </p>
        </div>

        {/* Registration Form Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8 space-y-6">
          {/* Success Message */}
          {registrationSuccess && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md animate-fade-in">
              <div className="flex">
                <FaCheckCircle className="text-green-400 text-xl mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Registration Successful!</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Your account has been created. Redirecting to login...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* API Error Message */}
          {apiError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-shake">
              <div className="flex">
                <FaTimesCircle className="text-red-400 text-xl mt-0.5" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{apiError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className={`${errors.name ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.name
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : touched.name && formData.name.trim().length >= 2
                      ? 'border-green-300 focus:ring-green-500'
                      : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                  placeholder="Enter your full name"
                  disabled={loading || registrationSuccess}
                />
                {formData.name.trim().length >= 2 && !errors.name && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <FaCheckCircle className="text-green-500" />
                  </div>
                )}
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className={`${errors.email ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : touched.email && validateEmail(formData.email).isValid
                      ? 'border-green-300 focus:ring-green-500'
                      : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                  placeholder="your.email@example.com"
                  disabled={loading || registrationSuccess}
                />
                {touched.email && validateEmail(formData.email).isValid && !errors.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <FaCheckCircle className="text-green-500" />
                  </div>
                )}
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Mobile Number */}
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaMobileAlt className={`${errors.mobile ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  maxLength="10"
                  value={formData.mobile}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.mobile
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : touched.mobile && validateMobile(formData.mobile).isValid
                      ? 'border-green-300 focus:ring-green-500'
                      : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                  placeholder="10-digit mobile number"
                  disabled={loading || registrationSuccess}
                />
                {touched.mobile && validateMobile(formData.mobile).isValid && !errors.mobile && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <FaCheckCircle className="text-green-500" />
                  </div>
                )}
              </div>
              {errors.mobile && <p className="mt-1 text-sm text-red-600">{errors.mobile}</p>}
              {!errors.mobile && formData.mobile && !validateMobile(formData.mobile).isValid && (
                <p className="mt-1 text-xs text-gray-500">Format: 10 digits starting with 6-9 (e.g., 9876543210)</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className={`${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.password
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                  placeholder="Minimum 8 characters"
                  disabled={loading || registrationSuccess}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  disabled={loading || registrationSuccess}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password Strength:</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength.strength === 100 ? 'text-green-600' :
                      passwordStrength.strength >= 75 ? 'text-yellow-600' :
                      passwordStrength.strength >= 50 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className={`${errors.confirmPassword ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.confirmPassword
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : passwordsMatch
                      ? 'border-green-300 focus:ring-green-500'
                      : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                  placeholder="Re-enter your password"
                  disabled={loading || registrationSuccess}
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  disabled={loading || registrationSuccess}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              {passwordsMatch && !errors.confirmPassword && (
                <p className="mt-1 text-sm text-green-600 flex items-center">
                  <FaCheckCircle className="mr-1" /> Passwords match
                </p>
              )}
            </div>

            {/* Info Box - Visitor Registration Only */}
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-start space-x-3">
                <FaInfoCircle className="text-indigo-600 mt-0.5 flex-shrink-0" size={20} />
                <div className="text-sm">
                  <p className="font-semibold text-indigo-900 mb-1">Visitor Registration</p>
                  <p className="text-indigo-700">
                    This registration is for visitors only. Organization members and watchmen are added by their organization admin. 
                    If you're a member or watchman, please contact your organization admin for login credentials.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || registrationSuccess || !isFormValid()}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-200 ${
                  loading || registrationSuccess || !isFormValid()
                    ? 'bg-purple-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform hover:scale-105'
                }`}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : registrationSuccess ? (
                  <>
                    <FaCheckCircle className="mr-2" />
                    Registration Successful!
                  </>
                ) : (
                  <>
                    <FaUserPlus className="mr-2" />
                    Create Account
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-purple-300 rounded-lg text-sm font-medium text-purple-600 bg-white hover:bg-purple-50 transition-all duration-200 transform hover:scale-105"
              >
                Sign In Here
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
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

export default Register;
