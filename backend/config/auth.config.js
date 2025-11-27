/**
 * Authentication and Application Configuration Module
 * Centralized configuration for JWT, password hashing, validation rules, and enums
 */

// JWT Configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'parkmitra_secret_key_change_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h', // 24 hours
  refreshTokenExpiresIn: '7d', // 7 days
  algorithm: 'HS256',
  issuer: 'parkmitra',
  audience: 'parkmitra-api'
};

// Password Security Configuration
const passwordConfig = {
  saltRounds: 10, // Bcrypt salt rounds
  minLength: 8, // Minimum password length
  maxLength: 128, // Maximum password length
  requireUppercase: false, // Require at least one uppercase letter
  requireLowercase: false, // Require at least one lowercase letter
  requireNumbers: false, // Require at least one number
  requireSpecialChars: false // Require at least one special character
};

// Validation Patterns
const validationPatterns = {
  // Mobile number: Exactly 10 digits
  mobile: {
    pattern: /^[0-9]{10}$/,
    message: 'Mobile number must be exactly 10 digits'
  },
  
  // Email: Standard email format (supports +, ., _, - characters)
  email: {
    pattern: /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    message: 'Invalid email format'
  },
  
  // Vehicle number: Indian vehicle registration format (flexible)
  // Supports formats: KA01AB1234, DL1CAB1234, MH12A1234, etc.
  vehicleNumber: {
    pattern: /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/,
    message: 'Invalid vehicle number format (e.g., KA01AB1234, DL1CAB1234)'
  },
  
  // Employee ID: Alphanumeric, 3-20 characters
  employeeId: {
    pattern: /^[A-Z0-9]{3,20}$/,
    message: 'Employee ID must be 3-20 alphanumeric characters'
  },
  
  // Slot number: Format like A-101, B-205, etc.
  slotNumber: {
    pattern: /^[A-Z]{1,2}-[0-9]{1,4}$/,
    message: 'Invalid slot number format (e.g., A-101)'
  }
};

// User Type Enums
const userTypes = {
  ORGANIZATION_MEMBER: 'organization_member',
  VISITOR: 'visitor',
  WALK_IN: 'walk_in'
};

// Array of allowed user types
const allowedUserTypes = [
  userTypes.ORGANIZATION_MEMBER,
  userTypes.VISITOR,
  userTypes.WALK_IN
];

// Payment Method Enums
const paymentMethods = {
  ONLINE: 'online',
  CASH: 'cash'
};

// Array of allowed payment methods
const allowedPaymentMethods = [
  paymentMethods.ONLINE,
  paymentMethods.CASH
];

// Payment Status Enums
const paymentStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Array of allowed payment statuses
const allowedPaymentStatuses = [
  paymentStatus.PENDING,
  paymentStatus.COMPLETED,
  paymentStatus.FAILED
];

// Booking Status Enums
const bookingStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Array of allowed booking statuses
const allowedBookingStatuses = [
  bookingStatus.ACTIVE,
  bookingStatus.COMPLETED,
  bookingStatus.CANCELLED
];

// Token Types
const tokenTypes = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  RESET_PASSWORD: 'reset_password',
  VERIFY_EMAIL: 'verify_email'
};

// Rate Limiting Configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
};

// API Response Messages
const responseMessages = {
  success: {
    LOGIN: 'Login successful',
    LOGOUT: 'Logout successful',
    REGISTER: 'Registration successful',
    BOOKING_CREATED: 'Booking created successfully',
    PAYMENT_COMPLETED: 'Payment completed successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
    PASSWORD_CHANGED: 'Password changed successfully'
  },
  error: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_NOT_FOUND: 'User not found',
    EMAIL_EXISTS: 'Email already registered',
    MOBILE_EXISTS: 'Mobile number already registered',
    UNAUTHORIZED: 'Unauthorized access',
    TOKEN_EXPIRED: 'Token has expired',
    TOKEN_INVALID: 'Invalid token',
    INSUFFICIENT_SLOTS: 'No parking slots available',
    BOOKING_NOT_FOUND: 'Booking not found',
    PAYMENT_FAILED: 'Payment processing failed',
    INVALID_USER_TYPE: 'Invalid user type',
    INVALID_PAYMENT_METHOD: 'Invalid payment method',
    INVALID_BOOKING_STATUS: 'Invalid booking status',
    SERVER_ERROR: 'Internal server error'
  }
};

// Validation Helper Functions
const validators = {
  /**
   * Validate mobile number
   * @param {string} mobile - Mobile number to validate
   * @returns {boolean}
   */
  isValidMobile: (mobile) => {
    return validationPatterns.mobile.pattern.test(mobile);
  },

  /**
   * Validate email
   * @param {string} email - Email to validate
   * @returns {boolean}
   */
  isValidEmail: (email) => {
    return validationPatterns.email.pattern.test(email);
  },

  /**
   * Validate password
   * @param {string} password - Password to validate
   * @returns {boolean}
   */
  isValidPassword: (password) => {
    if (!password || password.length < passwordConfig.minLength) {
      return false;
    }
    if (password.length > passwordConfig.maxLength) {
      return false;
    }
    if (passwordConfig.requireUppercase && !/[A-Z]/.test(password)) {
      return false;
    }
    if (passwordConfig.requireLowercase && !/[a-z]/.test(password)) {
      return false;
    }
    if (passwordConfig.requireNumbers && !/[0-9]/.test(password)) {
      return false;
    }
    if (passwordConfig.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return false;
    }
    return true;
  },

  /**
   * Validate user type
   * @param {string} userType - User type to validate
   * @returns {boolean}
   */
  isValidUserType: (userType) => {
    return allowedUserTypes.includes(userType);
  },

  /**
   * Validate payment method
   * @param {string} method - Payment method to validate
   * @returns {boolean}
   */
  isValidPaymentMethod: (method) => {
    return allowedPaymentMethods.includes(method);
  },

  /**
   * Validate booking status
   * @param {string} status - Booking status to validate
   * @returns {boolean}
   */
  isValidBookingStatus: (status) => {
    return allowedBookingStatuses.includes(status);
  },

  /**
   * Validate payment status
   * @param {string} status - Payment status to validate
   * @returns {boolean}
   */
  isValidPaymentStatus: (status) => {
    return allowedPaymentStatuses.includes(status);
  },

  /**
   * Validate vehicle number
   * @param {string} vehicleNumber - Vehicle number to validate
   * @returns {boolean}
   */
  isValidVehicleNumber: (vehicleNumber) => {
    return validationPatterns.vehicleNumber.pattern.test(vehicleNumber);
  }
};

// Export all configurations
module.exports = {
  // JWT Configuration
  jwtSecret: jwtConfig.secret,
  jwtExpiresIn: jwtConfig.expiresIn,
  jwtConfig,

  // Password Configuration
  saltRounds: passwordConfig.saltRounds,
  passwordMinLength: passwordConfig.minLength,
  passwordConfig,

  // Validation Patterns
  mobilePattern: validationPatterns.mobile.pattern,
  emailPattern: validationPatterns.email.pattern,
  validationPatterns,

  // Enums
  userTypes,
  allowedUserTypes,
  paymentMethods,
  allowedPaymentMethods,
  paymentStatus,
  allowedPaymentStatuses,
  bookingStatus,
  allowedBookingStatuses,
  tokenTypes,

  // Rate Limiting
  rateLimitConfig,

  // Response Messages
  responseMessages,

  // Validators
  validators,

  // Legacy support (for backward compatibility)
  refreshTokenExpiresIn: jwtConfig.refreshTokenExpiresIn
};
