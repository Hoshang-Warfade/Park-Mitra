import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import { validateEmail, validateMobile } from '../../utils/validation';
import {
  FaBuilding,
  FaMapMarkerAlt,
  FaUser,
  FaEnvelope,
  FaMobileAlt,
  FaLock,
  FaCar,
  FaRupeeSign,
  FaClipboardList,
  FaCheckCircle,
  FaSpinner,
  FaArrowLeft,
  FaArrowRight,
  FaClock,
  FaInfoCircle,
  FaShieldAlt,
  FaParking,
  FaPlus,
  FaTrash
} from 'react-icons/fa';

/**
 * OrganizationRegister Component
 * Multi-step form for registering a new organization with parking management
 */
const OrganizationRegister = () => {
  const navigate = useNavigate();

  // Current step in the multi-step form
  const [currentStep, setCurrentStep] = useState(1);

  // Form data for all steps
  const [formData, setFormData] = useState({
    org_name: '',
    address: '',
    admin_name: '',
    admin_email: '',
    admin_mobile: '',
    admin_password: '',
    total_slots: '',
    visitor_hourly_rate: '',
    parking_rules: '',
    operating_hours: ''
  });

  // Parking lots array for multi-lot setup
  const [parkingLots, setParkingLots] = useState([
    {
      id: 1,
      lot_name: 'Main Parking Area',
      lot_description: '',
      total_slots: '',
      priority_order: 1
    }
  ]);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registrationResponse, setRegistrationResponse] = useState(null);

  /**
   * Validate email format
   */
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validate mobile number (exactly 10 digits)
   */
  const isValidMobile = (mobile) => {
    const mobileRegex = /^\d{10}$/;
    return mobileRegex.test(mobile);
  };

  /**
   * Calculate password strength
   */
  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 8) return { strength: 25, label: 'Weak', color: 'bg-red-500' };
    
    let strength = 25;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 12.5;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 12.5;

    if (strength <= 25) return { strength: 25, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 50) return { strength: 50, label: 'Fair', color: 'bg-orange-500' };
    if (strength <= 75) return { strength: 75, label: 'Good', color: 'bg-yellow-500' };
    return { strength: 100, label: 'Strong', color: 'bg-green-500' };
  };

  /**
   * Validate fields for a specific step
   */
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      // Step 1: Organization Details
      if (!formData.org_name.trim()) {
        newErrors.org_name = 'Organization name is required';
      } else if (formData.org_name.trim().length < 3) {
        newErrors.org_name = 'Organization name must be at least 3 characters';
      }

      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
      } else if (formData.address.trim().length < 10) {
        newErrors.address = 'Please provide a complete address';
      }

      if (!formData.operating_hours.trim()) {
        newErrors.operating_hours = 'Operating hours are required';
      }
    }

    if (step === 2) {
      // Step 2: Admin Details
      if (!formData.admin_name.trim()) {
        newErrors.admin_name = 'Admin name is required';
      } else if (formData.admin_name.trim().length < 2) {
        newErrors.admin_name = 'Admin name must be at least 2 characters';
      }

      if (!formData.admin_email.trim()) {
        newErrors.admin_email = 'Admin email is required';
      } else if (!isValidEmail(formData.admin_email)) {
        newErrors.admin_email = 'Please enter a valid email address';
      }

      if (!formData.admin_mobile.trim()) {
        newErrors.admin_mobile = 'Admin mobile is required';
      } else if (!isValidMobile(formData.admin_mobile)) {
        newErrors.admin_mobile = 'Mobile number must be exactly 10 digits';
      }

      if (!formData.admin_password) {
        newErrors.admin_password = 'Password is required';
      } else if (formData.admin_password.length < 8) {
        newErrors.admin_password = 'Password must be at least 8 characters';
      }
    }

    if (step === 3) {
      // Step 3: Parking Configuration
      // Validate parking lots
      if (parkingLots.length === 0) {
        newErrors.parking_lots = 'At least one parking lot is required';
      } else {
        // Validate each parking lot
        let hasLotErrors = false;
        parkingLots.forEach((lot, index) => {
          if (!lot.lot_name.trim()) {
            newErrors[`lot_name_${index}`] = 'Parking lot name is required';
            hasLotErrors = true;
          }
          if (!lot.total_slots || parseInt(lot.total_slots) <= 0) {
            newErrors[`lot_slots_${index}`] = 'Valid number of slots is required';
            hasLotErrors = true;
          }
        });
        if (hasLotErrors) {
          newErrors.parking_lots = 'Please fix errors in parking lot details';
        }
      }

      if (!formData.visitor_hourly_rate) {
        newErrors.visitor_hourly_rate = 'Visitor hourly rate is required';
      } else if (isNaN(formData.visitor_hourly_rate) || parseFloat(formData.visitor_hourly_rate) < 0) {
        newErrors.visitor_hourly_rate = 'Please enter a valid rate';
      } else if (parseFloat(formData.visitor_hourly_rate) > 1000) {
        newErrors.visitor_hourly_rate = 'Rate seems too high. Maximum ₹1000/hour';
      }

      if (!formData.parking_rules.trim()) {
        newErrors.parking_rules = 'Parking rules are required';
      } else if (formData.parking_rules.trim().length < 20) {
        newErrors.parking_rules = 'Please provide more detailed parking rules';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle input changes with real-time validation
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Real-time validation for email and mobile fields as user types
    if (name === 'admin_email') {
      if (value) {
        const emailValidation = validateEmail(value);
        if (!emailValidation.isValid) {
          setErrors(prev => ({ ...prev, admin_email: emailValidation.error }));
        } else {
          // Valid email - clear error
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.admin_email;
            return newErrors;
          });
        }
      } else {
        // Empty email - show required error
        setErrors(prev => ({ ...prev, admin_email: 'Admin email is required' }));
      }
    } else if (name === 'admin_mobile') {
      if (value) {
        const mobileValidation = validateMobile(value);
        // Show validation error immediately if format is wrong
        if (!mobileValidation.isValid) {
          setErrors(prev => ({ ...prev, admin_mobile: mobileValidation.error }));
        } else {
          // Valid mobile - clear error
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.admin_mobile;
            return newErrors;
          });
        }
      } else {
        // Empty mobile - show required error
        setErrors(prev => ({ ...prev, admin_mobile: 'Admin mobile is required' }));
      }
    } else {
      // Clear error for other fields when user types
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Handle next step
   */
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * Handle back step
   */
  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Add a new parking lot
   */
  const handleAddParkingLot = () => {
    const newLot = {
      id: Date.now(),
      lot_name: '',
      lot_description: '',
      total_slots: '',
      priority_order: parkingLots.length + 1
    };
    setParkingLots([...parkingLots, newLot]);
  };

  /**
   * Remove a parking lot
   */
  const handleRemoveParkingLot = (lotId) => {
    if (parkingLots.length === 1) {
      alert('At least one parking lot is required');
      return;
    }
    const updatedLots = parkingLots.filter(lot => lot.id !== lotId);
    // Re-assign priority orders
    updatedLots.forEach((lot, index) => {
      lot.priority_order = index + 1;
    });
    setParkingLots(updatedLots);
  };

  /**
   * Handle parking lot input changes
   */
  const handleParkingLotChange = (lotId, field, value) => {
    setParkingLots(parkingLots.map(lot => 
      lot.id === lotId ? { ...lot, [field]: value } : lot
    ));
    // Clear specific lot errors
    const lotIndex = parkingLots.findIndex(lot => lot.id === lotId);
    if (lotIndex !== -1) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`lot_name_${lotIndex}`];
        delete newErrors[`lot_slots_${lotIndex}`];
        delete newErrors.parking_lots;
        return newErrors;
      });
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all steps
    const step1Valid = validateStep(1);
    const step2Valid = validateStep(2);
    const step3Valid = validateStep(3);

    if (!step1Valid || !step2Valid || !step3Valid) {
      // Go back to first invalid step
      if (!step1Valid) setCurrentStep(1);
      else if (!step2Valid) setCurrentStep(2);
      else if (!step3Valid) setCurrentStep(3);
      return;
    }

    setLoading(true);

    try {
      // Calculate total slots from all parking lots
      const totalSlots = parkingLots.reduce((sum, lot) => sum + parseInt(lot.total_slots), 0);

      // Prepare data for API
      const registrationData = {
        org_name: formData.org_name,
        address: formData.address,
        operating_hours: formData.operating_hours,
        total_slots: totalSlots, // Sum of all parking lot slots
        visitor_hourly_rate: parseFloat(formData.visitor_hourly_rate),
        parking_rules: formData.parking_rules,
        admin_name: formData.admin_name,
        admin_email: formData.admin_email,
        admin_mobile: formData.admin_mobile,
        admin_password: formData.admin_password,
        parking_lots: parkingLots.map(lot => ({
          lot_name: lot.lot_name,
          lot_description: lot.lot_description || null,
          total_slots: parseInt(lot.total_slots),
          priority_order: lot.priority_order
        }))
      };

      // Call register organization API
      const response = await authService.registerOrganization(registrationData);
      
      setRegistrationResponse(response);
      setShowSuccessModal(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      setErrors({ api: error.message || 'Registration failed. Please try again.' });
      console.error('Organization registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate password strength for display
  const passwordStrength = getPasswordStrength(formData.admin_password);

  // Step titles
  const steps = [
    { number: 1, title: 'Organization Details', icon: FaBuilding },
    { number: 2, title: 'Admin Account', icon: FaUser },
    { number: 3, title: 'Parking Configuration', icon: FaCar }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 rounded-full shadow-lg">
              <FaBuilding className="text-white text-4xl" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Register Your Organization
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Set up your parking management system in 3 easy steps
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${
                      currentStep >= step.number
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 shadow-lg scale-110'
                        : 'bg-gray-300'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <FaCheckCircle className="text-2xl" />
                    ) : (
                      <step.icon className="text-xl" />
                    )}
                  </div>
                  <p
                    className={`mt-2 text-xs font-medium ${
                      currentStep >= step.number ? 'text-indigo-600' : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-2">
                    <div
                      className={`h-1 rounded transition-all duration-300 ${
                        currentStep > step.number ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    ></div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Counter */}
          <div className="text-center mb-6">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep} of {steps.length}
            </span>
          </div>

          {/* API Error */}
          {errors.api && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-shake">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaInfoCircle className="text-red-400 text-xl" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{errors.api}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Organization Details */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-fade-in">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FaBuilding className="mr-2 text-indigo-600" />
                  Organization Details
                </h3>

                {/* Organization Name */}
                <div>
                  <label htmlFor="org_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBuilding className="text-gray-400" />
                    </div>
                    <input
                      id="org_name"
                      name="org_name"
                      type="text"
                      value={formData.org_name}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.org_name
                          ? 'border-red-300 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-indigo-500'
                      }`}
                      placeholder="Enter your organization name"
                    />
                  </div>
                  {errors.org_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.org_name}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Complete Address *
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <FaMapMarkerAlt className="text-gray-400" />
                    </div>
                    <textarea
                      id="address"
                      name="address"
                      rows="3"
                      value={formData.address}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.address
                          ? 'border-red-300 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-indigo-500'
                      }`}
                      placeholder="Enter complete address with city, state, and PIN code"
                    />
                  </div>
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>

                {/* Operating Hours */}
                <div>
                  <label htmlFor="operating_hours" className="block text-sm font-medium text-gray-700 mb-2">
                    Operating Hours *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaClock className="text-gray-400" />
                    </div>
                    <input
                      id="operating_hours"
                      name="operating_hours"
                      type="text"
                      value={formData.operating_hours}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.operating_hours
                          ? 'border-red-300 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-indigo-500'
                      }`}
                      placeholder="e.g., 8 AM - 8 PM"
                    />
                  </div>
                  {errors.operating_hours && (
                    <p className="mt-1 text-sm text-red-600">{errors.operating_hours}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Example: 8 AM - 8 PM or 24/7</p>
                </div>

                {/* Next Button */}
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-105"
                  >
                    Next
                    <FaArrowRight className="ml-2" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Admin Account */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-fade-in">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FaUser className="mr-2 text-indigo-600" />
                  Admin Account Setup
                </h3>

                {/* Info Box */}
                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-md">
                  <div className="flex">
                    <FaInfoCircle className="text-indigo-400 text-xl mt-0.5" />
                    <div className="ml-3">
                      <p className="text-sm text-indigo-700 font-medium">
                        These will be your login credentials to manage parking operations
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admin Name */}
                <div>
                  <label htmlFor="admin_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-gray-400" />
                    </div>
                    <input
                      id="admin_name"
                      name="admin_name"
                      type="text"
                      value={formData.admin_name}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.admin_name
                          ? 'border-red-300 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-indigo-500'
                      }`}
                      placeholder="Enter admin name"
                    />
                  </div>
                  {errors.admin_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.admin_name}</p>
                  )}
                </div>

                {/* Admin Email */}
                <div>
                  <label htmlFor="admin_email" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className={`${errors.admin_email ? 'text-red-400' : formData.admin_email && !errors.admin_email ? 'text-green-400' : 'text-gray-400'}`} />
                    </div>
                    <input
                      id="admin_email"
                      name="admin_email"
                      type="email"
                      value={formData.admin_email}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.admin_email
                          ? 'border-red-300 focus:ring-red-500 bg-red-50'
                          : formData.admin_email && !errors.admin_email
                          ? 'border-green-300 focus:ring-green-500 bg-green-50'
                          : 'border-gray-300 focus:ring-indigo-500'
                      }`}
                      placeholder="admin@organization.com"
                    />
                    {formData.admin_email && !errors.admin_email && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <FaCheckCircle className="text-green-500 text-xl" />
                      </div>
                    )}
                  </div>
                  {errors.admin_email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <span className="mr-1">⚠️</span> {errors.admin_email}
                    </p>
                  )}
                  {formData.admin_email && !errors.admin_email && (
                    <p className="mt-1 text-sm text-green-600 flex items-center">
                      <FaCheckCircle className="mr-1" /> Valid email format
                    </p>
                  )}
                </div>

                {/* Admin Mobile */}
                <div>
                  <label htmlFor="admin_mobile" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Mobile Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMobileAlt className={`${errors.admin_mobile ? 'text-red-400' : formData.admin_mobile && !errors.admin_mobile ? 'text-green-400' : 'text-gray-400'}`} />
                    </div>
                    <input
                      id="admin_mobile"
                      name="admin_mobile"
                      type="tel"
                      maxLength="10"
                      value={formData.admin_mobile}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.admin_mobile
                          ? 'border-red-300 focus:ring-red-500 bg-red-50'
                          : formData.admin_mobile && !errors.admin_mobile
                          ? 'border-green-300 focus:ring-green-500 bg-green-50'
                          : 'border-gray-300 focus:ring-indigo-500'
                      }`}
                      placeholder="10-digit mobile number"
                    />
                    {formData.admin_mobile && !errors.admin_mobile && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <FaCheckCircle className="text-green-500 text-xl" />
                      </div>
                    )}
                  </div>
                  {errors.admin_mobile && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <span className="mr-1">⚠️</span> {errors.admin_mobile}
                    </p>
                  )}
                  {formData.admin_mobile && !errors.admin_mobile && (
                    <p className="mt-1 text-sm text-green-600 flex items-center">
                      <FaCheckCircle className="mr-1" /> Valid mobile number
                    </p>
                  )}
                  {!formData.admin_mobile && !errors.admin_mobile && (
                    <p className="mt-1 text-xs text-gray-500">Format: 10 digits starting with 6-9 (e.g., 9876543210)</p>
                  )}
                </div>

                {/* Admin Password */}
                <div>
                  <label htmlFor="admin_password" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="text-gray-400" />
                    </div>
                    <input
                      id="admin_password"
                      name="admin_password"
                      type="password"
                      value={formData.admin_password}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.admin_password
                          ? 'border-red-300 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-indigo-500'
                      }`}
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                  {errors.admin_password && (
                    <p className="mt-1 text-sm text-red-600">{errors.admin_password}</p>
                  )}

                  {/* Password Strength Indicator */}
                  {formData.admin_password && (
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

                {/* Validation Status Info */}
                {(errors.admin_name || errors.admin_email || errors.admin_mobile || errors.admin_password) && (
                  <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
                    <div className="flex">
                      <FaInfoCircle className="text-yellow-400 text-lg mt-0.5 flex-shrink-0" />
                      <div className="ml-3">
                        <p className="text-sm text-yellow-800 font-medium">
                          Please fix all validation errors to proceed to the next step
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                  >
                    <FaArrowLeft className="mr-2" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={
                      !formData.admin_name.trim() ||
                      !formData.admin_email.trim() ||
                      !formData.admin_mobile.trim() ||
                      !formData.admin_password ||
                      errors.admin_name ||
                      errors.admin_email ||
                      errors.admin_mobile ||
                      errors.admin_password
                    }
                    className={`flex items-center px-6 py-3 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${
                      !formData.admin_name.trim() ||
                      !formData.admin_email.trim() ||
                      !formData.admin_mobile.trim() ||
                      !formData.admin_password ||
                      errors.admin_name ||
                      errors.admin_email ||
                      errors.admin_mobile ||
                      errors.admin_password
                        ? 'bg-indigo-300 cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transform hover:scale-105'
                    }`}
                  >
                    Next
                    <FaArrowRight className="ml-2" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Parking Configuration */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-fade-in">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FaCar className="mr-2 text-indigo-600" />
                  Parking Configuration
                </h3>

                {/* Parking Lots Section */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                      <FaParking className="text-blue-600" />
                      Parking Lots
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddParkingLot}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm transition-colors"
                    >
                      <FaPlus /> Add Lot
                    </button>
                  </div>

                  {errors.parking_lots && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-sm">
                      {errors.parking_lots}
                    </div>
                  )}

                  <div className="space-y-4">
                    {parkingLots.map((lot, index) => (
                      <div key={lot.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-semibold text-gray-700">
                            Parking Lot #{index + 1} (Priority: {lot.priority_order})
                          </span>
                          {parkingLots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveParkingLot(lot.id)}
                              className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                            >
                              <FaTrash /> Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Lot Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Lot Name *
                            </label>
                            <input
                              type="text"
                              value={lot.lot_name}
                              onChange={(e) => handleParkingLotChange(lot.id, 'lot_name', e.target.value)}
                              placeholder="e.g., E-Building Basement"
                              className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                errors[`lot_name_${index}`]
                                  ? 'border-red-300 focus:ring-red-500 bg-red-50'
                                  : 'border-gray-300 focus:ring-indigo-500'
                              }`}
                            />
                            {errors[`lot_name_${index}`] && (
                              <p className="mt-1 text-xs text-red-600">{errors[`lot_name_${index}`]}</p>
                            )}
                          </div>

                          {/* Total Slots */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Total Slots *
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10000"
                              value={lot.total_slots}
                              onChange={(e) => handleParkingLotChange(lot.id, 'total_slots', e.target.value)}
                              placeholder="Number of slots"
                              className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                errors[`lot_slots_${index}`]
                                  ? 'border-red-300 focus:ring-red-500 bg-red-50'
                                  : 'border-gray-300 focus:ring-indigo-500'
                              }`}
                            />
                            {errors[`lot_slots_${index}`] && (
                              <p className="mt-1 text-xs text-red-600">{errors[`lot_slots_${index}`]}</p>
                            )}
                          </div>

                          {/* Description */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description (Optional)
                            </label>
                            <input
                              type="text"
                              value={lot.lot_description}
                              onChange={(e) => handleParkingLotChange(lot.id, 'lot_description', e.target.value)}
                              placeholder="Brief description of this parking lot"
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total Slots Summary */}
                  <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total Parking Capacity:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {parkingLots.reduce((sum, lot) => sum + (parseInt(lot.total_slots) || 0), 0)} slots
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Parking lots will be filled sequentially based on priority order
                    </p>
                  </div>
                </div>

                {/* Visitor Hourly Rate */}
                <div>
                  <label htmlFor="visitor_hourly_rate" className="block text-sm font-medium text-gray-700 mb-2">
                    Visitor Hourly Rate (₹) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaRupeeSign className="text-gray-400" />
                    </div>
                    <input
                      id="visitor_hourly_rate"
                      name="visitor_hourly_rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.visitor_hourly_rate}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.visitor_hourly_rate
                          ? 'border-red-300 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-indigo-500'
                      }`}
                      placeholder="e.g., 50"
                    />
                  </div>
                  {errors.visitor_hourly_rate && (
                    <p className="mt-1 text-sm text-red-600">{errors.visitor_hourly_rate}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Parking charge per hour for visitors</p>
                </div>

                {/* Parking Rules */}
                <div>
                  <label htmlFor="parking_rules" className="block text-sm font-medium text-gray-700 mb-2">
                    Parking Rules & Guidelines *
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <FaClipboardList className="text-gray-400" />
                    </div>
                    <textarea
                      id="parking_rules"
                      name="parking_rules"
                      rows="5"
                      value={formData.parking_rules}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.parking_rules
                          ? 'border-red-300 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-indigo-500'
                      }`}
                      placeholder="Example:&#10;1. No parking in fire lanes&#10;2. Follow speed limit of 10 km/h&#10;3. Park only in designated slots&#10;4. Report damage immediately&#10;5. No overnight parking without permission"
                    />
                  </div>
                  {errors.parking_rules && (
                    <p className="mt-1 text-sm text-red-600">{errors.parking_rules}</p>
                  )}
                </div>

                {/* Member Parking Info */}
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
                  <div className="flex items-start">
                    <FaShieldAlt className="text-green-400 text-xl mt-0.5 flex-shrink-0" />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-green-800 mb-1">
                        Member Parking: FREE (Always)
                      </h4>
                      <p className="text-sm text-green-700">
                        Organization members park free of charge. They only need to book available slots for entry.
                        The visitor hourly rate applies only to external visitors.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                    disabled={loading}
                  >
                    <FaArrowLeft className="mr-2" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex items-center px-6 py-3 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${
                      loading
                        ? 'bg-indigo-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transform hover:scale-105'
                    }`}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="mr-2" />
                        Complete Registration
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Already registered? Sign in here
            </Link>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-4">
                  <FaCheckCircle className="text-green-500 text-5xl" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Registration Successful!
              </h3>
              <p className="text-gray-600 mb-6">
                Your organization has been registered successfully.
              </p>

              {registrationResponse && (
                <div className="bg-indigo-50 rounded-lg p-4 mb-6 text-left">
                  <h4 className="font-semibold text-indigo-900 mb-3">Organization Details:</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">Organization:</span> {registrationResponse.organization?.org_name}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Admin Email:</span> {registrationResponse.admin?.email}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Employee ID:</span> {registrationResponse.admin?.employee_id}
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-yellow-800 font-medium">
                      💡 Save your login credentials. Use your email and password to sign in.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500 mb-4">
                Redirecting to login page...
              </p>

              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all transform hover:scale-105"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}

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
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default OrganizationRegister;
