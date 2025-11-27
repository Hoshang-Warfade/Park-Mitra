// Frontend Validation Utilities

/**
 * Validate email address
 * @param {string} email - Email address to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Email is required'
    };
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length === 0) {
    return {
      isValid: false,
      error: 'Email cannot be empty'
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address'
    };
  }

  return {
    isValid: true,
    error: ''
  };
};

/**
 * Validate mobile number (Indian format - 10 digits)
 * @param {string} mobile - Mobile number to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
export const validateMobile = (mobile) => {
  if (!mobile || typeof mobile !== 'string') {
    return {
      isValid: false,
      error: 'Mobile number is required'
    };
  }

  const cleanedMobile = mobile.replace(/\s+/g, '').replace(/-/g, '');

  if (cleanedMobile.length === 0) {
    return {
      isValid: false,
      error: 'Mobile number cannot be empty'
    };
  }

  const mobileRegex = /^\d{10}$/;

  if (!mobileRegex.test(cleanedMobile)) {
    return {
      isValid: false,
      error: 'Mobile number must be exactly 10 digits'
    };
  }

  // Check if it starts with valid digits (6-9 for Indian numbers)
  if (!/^[6-9]/.test(cleanedMobile)) {
    return {
      isValid: false,
      error: 'Mobile number must start with 6, 7, 8, or 9'
    };
  }

  return {
    isValid: true,
    error: ''
  };
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - { isValid: boolean, error: string, strength: string }
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      error: 'Password is required',
      strength: 'weak'
    };
  }

  if (password.length === 0) {
    return {
      isValid: false,
      error: 'Password cannot be empty',
      strength: 'weak'
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters long',
      strength: 'weak'
    };
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  // Check minimum requirements (uppercase, lowercase, number)
  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return {
      isValid: false,
      error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      strength: 'weak'
    };
  }

  // Determine strength
  let strength = 'medium';
  let strengthScore = 0;

  if (hasUppercase) strengthScore++;
  if (hasLowercase) strengthScore++;
  if (hasNumber) strengthScore++;
  if (hasSpecialChar) strengthScore++;
  if (password.length >= 12) strengthScore++;

  if (strengthScore >= 4) {
    strength = 'strong';
  } else if (strengthScore >= 3) {
    strength = 'medium';
  } else {
    strength = 'weak';
  }

  return {
    isValid: true,
    error: '',
    strength: strength
  };
};

/**
 * Validate vehicle number (Indian format)
 * @param {string} vehicleNumber - Vehicle number to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
export const validateVehicleNumber = (vehicleNumber) => {
  if (!vehicleNumber || typeof vehicleNumber !== 'string') {
    return {
      isValid: false,
      error: 'Vehicle number is required'
    };
  }

  const cleanedNumber = vehicleNumber.replace(/\s+/g, '').replace(/-/g, '').toUpperCase();

  if (cleanedNumber.length === 0) {
    return {
      isValid: false,
      error: 'Vehicle number cannot be empty'
    };
  }

  // Indian vehicle number format: XX00XX0000 or XX00X0000
  // Examples: MH12AB1234, KA01A1234
  const vehicleRegex = /^[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{4}$/;

  if (!vehicleRegex.test(cleanedNumber)) {
    return {
      isValid: false,
      error: 'Invalid vehicle number format. Expected format: MH12AB1234'
    };
  }

  return {
    isValid: true,
    error: ''
  };
};

/**
 * Validate booking time
 * @param {string|Date} start_time - Booking start time
 * @param {string|Date} end_time - Booking end time
 * @returns {Object} - { isValid: boolean, error: string }
 */
export const validateBookingTime = (start_time, end_time) => {
  if (!start_time || !end_time) {
    return {
      isValid: false,
      error: 'Both start time and end time are required'
    };
  }

  const startDate = new Date(start_time);
  const endDate = new Date(end_time);
  const now = new Date();

  // Check if dates are valid
  if (isNaN(startDate.getTime())) {
    return {
      isValid: false,
      error: 'Invalid start time'
    };
  }

  if (isNaN(endDate.getTime())) {
    return {
      isValid: false,
      error: 'Invalid end time'
    };
  }

  // Check if start time is in the future (allow 5 minutes buffer)
  const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  if (startDate.getTime() < (now.getTime() - bufferTime)) {
    return {
      isValid: false,
      error: 'Start time must be in the future'
    };
  }

  // Check if end time is after start time
  if (endDate.getTime() <= startDate.getTime()) {
    return {
      isValid: false,
      error: 'End time must be after start time'
    };
  }

  // Check minimum booking duration (e.g., 30 minutes)
  const minDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
  if ((endDate.getTime() - startDate.getTime()) < minDuration) {
    return {
      isValid: false,
      error: 'Booking duration must be at least 30 minutes'
    };
  }

  // Check maximum booking duration (e.g., 24 hours)
  const maxDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  if ((endDate.getTime() - startDate.getTime()) > maxDuration) {
    return {
      isValid: false,
      error: 'Booking duration cannot exceed 24 hours'
    };
  }

  return {
    isValid: true,
    error: ''
  };
};

/**
 * Format errors object for display
 * @param {Object|string|Array} errors - Errors to format
 * @returns {string|Array} - Formatted error message(s)
 */
export const formatErrors = (errors) => {
  if (!errors) {
    return '';
  }

  // If it's already a string, return as is
  if (typeof errors === 'string') {
    return errors;
  }

  // If it's an array, join with line breaks
  if (Array.isArray(errors)) {
    return errors.filter(Boolean).join('\n');
  }

  // If it's an object, extract error messages
  if (typeof errors === 'object') {
    const errorMessages = [];

    // Handle nested error objects
    Object.keys(errors).forEach(key => {
      const value = errors[key];

      if (typeof value === 'string') {
        errorMessages.push(value);
      } else if (Array.isArray(value)) {
        errorMessages.push(...value);
      } else if (typeof value === 'object' && value.message) {
        errorMessages.push(value.message);
      }
    });

    // Return as array if multiple errors, string if single error
    if (errorMessages.length === 0) {
      return 'An error occurred';
    } else if (errorMessages.length === 1) {
      return errorMessages[0];
    } else {
      return errorMessages;
    }
  }

  return 'An error occurred';
};

/**
 * Validate form data against validation rules
 * @param {Object} formData - Form data to validate
 * @param {Object} rules - Validation rules
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export const validateForm = (formData, rules) => {
  const errors = {};
  let isValid = true;

  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = formData[field];

    // Required validation
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = rule.message || `${field} is required`;
      isValid = false;
      return;
    }

    // Skip other validations if field is empty and not required
    if (!value && !rule.required) {
      return;
    }

    // Type-specific validation
    if (rule.type === 'email') {
      const result = validateEmail(value);
      if (!result.isValid) {
        errors[field] = result.error;
        isValid = false;
      }
    } else if (rule.type === 'mobile') {
      const result = validateMobile(value);
      if (!result.isValid) {
        errors[field] = result.error;
        isValid = false;
      }
    } else if (rule.type === 'password') {
      const result = validatePassword(value);
      if (!result.isValid) {
        errors[field] = result.error;
        isValid = false;
      }
    } else if (rule.type === 'vehicle') {
      const result = validateVehicleNumber(value);
      if (!result.isValid) {
        errors[field] = result.error;
        isValid = false;
      }
    }

    // Min length validation
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = `${field} must be at least ${rule.minLength} characters`;
      isValid = false;
    }

    // Max length validation
    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `${field} cannot exceed ${rule.maxLength} characters`;
      isValid = false;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.message || `${field} format is invalid`;
      isValid = false;
    }

    // Custom validation function
    if (rule.validate && typeof rule.validate === 'function') {
      const customResult = rule.validate(value, formData);
      if (customResult !== true) {
        errors[field] = customResult || `${field} is invalid`;
        isValid = false;
      }
    }
  });

  return {
    isValid,
    errors
  };
};

// Legacy exports for backward compatibility
export const validatePasswordStrength = (password) => {
  const result = validatePassword(password);
  return result.isValid;
};
