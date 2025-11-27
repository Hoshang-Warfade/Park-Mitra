const { passwordConfig } = require('../config/auth.config');

/**
 * Validate mobile number (10 digits)
 * @param {String} mobile - Mobile number string
 * @returns {Boolean} True if valid, false otherwise
 */
const isValidMobile = (mobile) => {
  if (!mobile) return false;
  const mobileRegex = /^[0-9]{10}$/;
  return mobileRegex.test(mobile.toString().trim());
};

/**
 * Validate email format
 * @param {String} email - Email address string
 * @returns {Boolean} True if valid, false otherwise
 */
const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate user type
 * @param {String} user_type - User type string
 * @returns {Boolean} True if valid, false otherwise
 */
const isValidUserType = (user_type) => {
  if (!user_type) return false;
  const allowedUserTypes = ['visitor', 'organization_member', 'walk_in', 'admin'];
  return allowedUserTypes.includes(user_type);
};

/**
 * Validate vehicle number format
 * @param {String} vehicle_number - Vehicle registration number
 * @returns {Boolean} True if valid, false otherwise
 */
const isValidVehicleNumber = (vehicle_number) => {
  if (!vehicle_number) return false;
  
  // Remove spaces and convert to uppercase
  const cleaned = vehicle_number.replace(/\s+/g, '').toUpperCase();
  
  // Check format: letters + numbers, 6-10 characters
  // Accepts formats like: KA01AB1234, MH12CD5678, DL3CAF4943, etc.
  const vehicleRegex = /^[A-Z0-9]{6,10}$/;
  
  // More specific Indian vehicle number format (optional strict validation)
  const indianVehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;
  
  // Return true if either general or Indian format matches
  return vehicleRegex.test(cleaned) || indianVehicleRegex.test(cleaned);
};

/**
 * Calculate duration between two times in hours
 * @param {String|Date} start_time - Start time
 * @param {String|Date} end_time - End time
 * @returns {Number} Duration in hours (rounded to 2 decimal places)
 */
const calculateDuration = (start_time, end_time) => {
  try {
    const start = new Date(start_time);
    const end = new Date(end_time);
    
    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format');
    }
    
    // Calculate difference in milliseconds
    const diffMs = end - start;
    
    // Convert to hours
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Round to 2 decimal places
    return Math.round(diffHours * 100) / 100;
  } catch (error) {
    throw new Error('Error calculating duration: ' + error.message);
  }
};

/**
 * Calculate booking amount based on duration and user type
 * @param {Number} duration_hours - Duration in hours
 * @param {Number} hourly_rate - Hourly parking rate
 * @param {String} user_type - User type
 * @returns {Number} Calculated amount
 */
const calculateAmount = (duration_hours, hourly_rate, user_type) => {
  // Validate inputs
  if (duration_hours === undefined || hourly_rate === undefined) {
    throw new Error('duration_hours and hourly_rate are required');
  }
  
  if (duration_hours < 0) {
    throw new Error('duration_hours must be positive');
  }
  
  if (hourly_rate < 0) {
    throw new Error('hourly_rate must be positive');
  }
  
  // If user_type is 'organization_member', parking is free
  if (user_type === 'organization_member') {
    return 0;
  }
  
  // Calculate amount for visitors and walk-ins
  const amount = duration_hours * hourly_rate;
  
  // Round to 2 decimal places
  return Math.round(amount * 100) / 100;
};

/**
 * Format date to readable string (YYYY-MM-DD HH:MM)
 * @param {String|Date} date - Date object or ISO string
 * @returns {String} Formatted date string
 */
const formatDate = (date) => {
  try {
    const dateObj = new Date(date);
    
    // Validate date
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }
    
    // Format: YYYY-MM-DD HH:MM
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    throw new Error('Error formatting date: ' + error.message);
  }
};

/**
 * Validate booking time (must be in future)
 * @param {String|Date} booking_start_time - Booking start time
 * @returns {Object} { isValid: boolean, error: string|null }
 */
const isBookingTimeValid = (booking_start_time) => {
  try {
    const startTime = new Date(booking_start_time);
    const now = new Date();
    
    // Validate date format
    if (isNaN(startTime.getTime())) {
      return {
        isValid: false,
        error: 'Invalid booking time format'
      };
    }
    
    // Check if time is in future (allow 5 minute grace period for immediate bookings)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    if (startTime < fiveMinutesAgo) {
      return {
        isValid: false,
        error: 'Booking time must be in the future'
      };
    }
    
    // Check if booking is too far in future (max 30 days)
    const maxFutureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    if (startTime > maxFutureDate) {
      return {
        isValid: false,
        error: 'Booking time cannot be more than 30 days in advance'
      };
    }
    
    return {
      isValid: true,
      error: null
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Error validating booking time: ' + error.message
    };
  }
};

// Legacy validation functions (for backward compatibility)
const validateEmail = isValidEmail;
const validateMobile = isValidMobile;

const validateUserType = (userType) => {
  const validTypes = ['individual', 'member', 'org_admin', 'watchman', 'visitor', 'organization_member', 'walk_in'];
  return validTypes.includes(userType);
};

const validateVehicleNumber = isValidVehicleNumber;

const validateDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

const validateTime = (timeString) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

const validatePasswordStrength = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
};

const sanitizeString = (str) => {
  if (!str) return '';
  return str.trim().replace(/<[^>]*>/g, '');
};

module.exports = {
  // New utility functions
  isValidMobile,
  isValidEmail,
  isValidUserType,
  isValidVehicleNumber,
  calculateDuration,
  calculateAmount,
  formatDate,
  isBookingTimeValid,
  
  // Legacy functions (for backward compatibility)
  validateEmail,
  validateMobile,
  validateUserType,
  validateVehicleNumber,
  validateDate,
  validateTime,
  validatePasswordStrength,
  sanitizeString
};
