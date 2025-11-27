const { validationPatterns, allowedUserTypes } = require('../config/auth.config');
const User = require('../models/User');

/**
 * Validate Mobile Number
 * Checks if mobile exists, is string, and exactly 10 digits
 */
const validateMobile = (req, res, next) => {
  const { mobile } = req.body;

  // Check if mobile exists
  if (!mobile) {
    return res.status(400).json({ 
      error: 'Mobile number is required' 
    });
  }

  // Check if mobile is string
  if (typeof mobile !== 'string') {
    return res.status(400).json({ 
      error: 'Mobile number must be a string' 
    });
  }

  // Verify exactly 10 digits using regex
  if (!validationPatterns.mobile.pattern.test(mobile)) {
    return res.status(400).json({ 
      error: 'Mobile number must be exactly 10 digits' 
    });
  }

  next();
};

/**
 * Validate Email Format
 * Checks proper email format using regex pattern
 */
const validateEmail = (req, res, next) => {
  const { email } = req.body;

  // Check if email exists
  if (!email) {
    return res.status(400).json({ 
      error: 'Email is required' 
    });
  }

  // Check email format using regex
  if (!validationPatterns.email.pattern.test(email)) {
    return res.status(400).json({ 
      error: 'Invalid email format' 
    });
  }

  next();
};

/**
 * Validate User Type
 * Checks if user_type is one of: organization_member, visitor, walk_in
 */
const validateUserType = (req, res, next) => {
  const { user_type, userType } = req.body;
  const type = user_type || userType;

  // Check if user_type exists
  if (!type) {
    return res.status(400).json({ 
      error: 'User type is required' 
    });
  }

  // Check if user_type is valid
  if (!allowedUserTypes.includes(type)) {
    return res.status(400).json({ 
      error: 'Invalid user type. Must be one of: organization_member, visitor, walk_in' 
    });
  }

  next();
};

/**
 * Validate Password
 * Checks minimum length (8 chars) and complexity requirements
 */
const validatePassword = (req, res, next) => {
  const { password } = req.body;

  // Check if password exists
  if (!password) {
    return res.status(400).json({ 
      error: 'Password is required' 
    });
  }

  // Check minimum length (8 characters)
  if (password.length < 8) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters long' 
    });
  }

  // Check maximum length
  if (password.length > 128) {
    return res.status(400).json({ 
      error: 'Password must not exceed 128 characters' 
    });
  }

  // Verify contains at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ 
      error: 'Password must contain at least one uppercase letter' 
    });
  }

  // Verify contains at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return res.status(400).json({ 
      error: 'Password must contain at least one lowercase letter' 
    });
  }

  // Verify contains at least one number
  if (!/[0-9]/.test(password)) {
    return res.status(400).json({ 
      error: 'Password must contain at least one number' 
    });
  }

  next();
};

/**
 * Validate Vehicle Number
 * Checks if vehicle number is provided and has basic format
 */
const validateVehicleNumber = (req, res, next) => {
  const { vehicle_number, vehicleNumber } = req.body;
  const vehicleNum = vehicle_number || vehicleNumber;

  // Check if vehicle number provided
  if (!vehicleNum) {
    return res.status(400).json({ 
      error: 'Vehicle number is required' 
    });
  }

  // Convert to uppercase for validation
  const upperVehicleNum = vehicleNum.toUpperCase();

  // Verify basic format (alphanumeric, 6-10 characters)
  if (!/^[A-Z0-9]{6,10}$/.test(upperVehicleNum)) {
    return res.status(400).json({ 
      error: 'Invalid vehicle number format. Must be 6-10 alphanumeric characters' 
    });
  }

  // Optionally validate against Indian vehicle number pattern (stricter)
  // if (!validationPatterns.vehicleNumber.pattern.test(upperVehicleNum)) {
  //   return res.status(400).json({ 
  //     error: validationPatterns.vehicleNumber.message 
  //   });
  // }

  next();
};

/**
 * Validate Booking Time
 * Checks if booking times are valid and in correct sequence
 */
const validateBookingTime = (req, res, next) => {
  const { booking_start_time, booking_end_time, startTime, endTime } = req.body;
  
  const startTimeValue = booking_start_time || startTime;
  const endTimeValue = booking_end_time || endTime;

  // Check if times are provided
  if (!startTimeValue) {
    return res.status(400).json({ 
      error: 'Booking start time is required' 
    });
  }

  if (!endTimeValue) {
    return res.status(400).json({ 
      error: 'Booking end time is required' 
    });
  }

  // Parse times
  const startDate = new Date(startTimeValue);
  const endDate = new Date(endTimeValue);
  const currentDate = new Date();

  // Check if dates are valid
  if (isNaN(startDate.getTime())) {
    return res.status(400).json({ 
      error: 'Invalid booking start time format' 
    });
  }

  if (isNaN(endDate.getTime())) {
    return res.status(400).json({ 
      error: 'Invalid booking end time format' 
    });
  }

  // Check if booking_start_time is in future
  if (startDate < currentDate) {
    return res.status(400).json({ 
      error: 'Booking start time must be in the future' 
    });
  }

  // Verify booking_end_time is after start_time
  if (endDate <= startDate) {
    return res.status(400).json({ 
      error: 'Booking end time must be after start time' 
    });
  }

  // Calculate duration in hours
  const durationMs = endDate - startDate;
  const durationHours = durationMs / (1000 * 60 * 60);

  // Check minimum duration (e.g., 1 hour)
  if (durationHours < 1) {
    return res.status(400).json({ 
      error: 'Booking duration must be at least 1 hour' 
    });
  }

  // Check maximum duration (e.g., 24 hours)
  if (durationHours > 24) {
    return res.status(400).json({ 
      error: 'Booking duration cannot exceed 24 hours' 
    });
  }

  // Attach duration to request for later use
  req.bookingDuration = durationHours;

  next();
};

/**
 * Validate Organization Member
 * Prevents visitors from faking identity for free parking
 * Verifies user exists in organization and employee_id matches
 */
const validateOrganizationMember = async (req, res, next) => {
  try {
    const { user_id, userId, organization_id, organizationId, employee_id, employeeId } = req.body;
    
    const userIdValue = user_id || userId || req.user?.id;
    const organizationIdValue = organization_id || organizationId;
    const employeeIdValue = employee_id || employeeId;

    // Check if required fields are provided
    if (!userIdValue) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }

    if (!organizationIdValue) {
      return res.status(400).json({ 
        error: 'Organization ID is required' 
      });
    }

    // Query database to verify user exists in organization
    const user = await User.findById(userIdValue);

    if (!user) {
      return res.status(400).json({ 
        error: 'User is not a valid organization member' 
      });
    }

    // Verify user belongs to the organization
    if (user.organization_id !== parseInt(organizationIdValue)) {
      return res.status(400).json({ 
        error: 'User is not a valid organization member' 
      });
    }

    // Check if user type is organization_member
    if (user.user_type !== 'organization_member') {
      return res.status(400).json({ 
        error: 'User is not a valid organization member' 
      });
    }

    // Check if employee_id matches (if provided)
    if (employeeIdValue && user.employee_id !== employeeIdValue) {
      return res.status(400).json({ 
        error: 'User is not a valid organization member' 
      });
    }

    // Attach verified user to request
    req.verifiedUser = user;

    next();
  } catch (error) {
    console.error('Error validating organization member:', error);
    return res.status(500).json({ 
      error: 'Failed to validate organization member' 
    });
  }
};

// Legacy validation functions for backward compatibility

/**
 * Validate user registration
 */
const validateRegistration = (req, res, next) => {
  const { name, email, mobile, password, userType, user_type } = req.body;
  const type = userType || user_type; // Support both formats

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ 
      success: false, 
      message: 'Name must be at least 2 characters long' 
    });
  }

  if (!email || !validationPatterns.email.pattern.test(email)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid email format' 
    });
  }

  if (!mobile || !validationPatterns.mobile.pattern.test(mobile)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid mobile number. Must be 10 digits' 
    });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password must be at least 8 characters long' 
    });
  }

  if (!type || !allowedUserTypes.includes(type)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid user type' 
    });
  }

  next();
};

/**
 * Validate login
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email/Employee ID and password are required' 
    });
  }

  // Allow both email and employee_id formats
  // Email format: user@example.com
  // Employee ID format: EMP001, WM001, etc.
  const isEmail = validationPatterns.email.pattern.test(email);
  const isEmployeeId = /^[A-Z0-9]{3,50}$/i.test(email); // Allow alphanumeric employee IDs
  
  if (!isEmail && !isEmployeeId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid email or employee ID format' 
    });
  }

  next();
};

/**
 * Validate booking creation
 */
const validateBooking = (req, res, next) => {
  // Support both camelCase and snake_case field names
  const { 
    organizationId, organization_id,
    bookingDate, booking_start_time, booking_end_time,
    startTime, endTime,
    vehicleNumber, vehicle_number,
    vehicleType, vehicle_type
  } = req.body;

  const orgId = organizationId || organization_id;
  const startTimeValue = booking_start_time || startTime;
  const endTimeValue = booking_end_time || endTime;
  const vehicleNum = vehicleNumber || vehicle_number;
  const vehicleTypeValue = vehicleType || vehicle_type;

  if (!orgId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Organization ID is required' 
    });
  }

  if (!startTimeValue || !endTimeValue) {
    return res.status(400).json({ 
      success: false, 
      message: 'Booking start time and end time are required' 
    });
  }

  // Validate vehicle number format (flexible for different formats)
  if (!vehicleNum) {
    return res.status(400).json({ 
      success: false, 
      message: 'Vehicle number is required' 
    });
  }

  const upperVehicleNum = vehicleNum.toString().toUpperCase();
  // Allow formats like: KA01AB1234, DL1CAB1234, KA-01-AB-1234, etc.
  if (!/^[A-Z0-9-]{6,15}$/.test(upperVehicleNum)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid vehicle number format' 
    });
  }

  // Vehicle type is optional, but if provided, validate it
  if (vehicleTypeValue) {
    const validVehicleTypes = ['2-wheeler', '4-wheeler', 'bicycle', 'car', 'bike', 'scooter', 'Car', 'Bike', 'Scooter'];
    if (!validVehicleTypes.includes(vehicleTypeValue)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid vehicle type. Allowed: car, bike, scooter, Car, Bike, Scooter' 
      });
    }
  }

  next();
};

/**
 * Validate organization registration
 */
const validateOrganization = (req, res, next) => {
  const { org_name, address, admin_email, admin_mobile, total_slots, visitor_hourly_rate } = req.body;

  if (!org_name || org_name.trim().length < 3) {
    return res.status(400).json({ 
      success: false, 
      message: 'Organization name must be at least 3 characters long' 
    });
  }

  if (!address || address.trim().length < 10) {
    return res.status(400).json({ 
      success: false, 
      message: 'Address must be at least 10 characters long' 
    });
  }

  if (admin_email && !validationPatterns.email.pattern.test(admin_email)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid admin email format' 
    });
  }

  if (admin_mobile && !validationPatterns.mobile.pattern.test(admin_mobile)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid admin mobile number' 
    });
  }

  if (total_slots && total_slots < 1) {
    return res.status(400).json({ 
      success: false, 
      message: 'Total slots must be at least 1' 
    });
  }

  if (visitor_hourly_rate && visitor_hourly_rate < 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Visitor hourly rate must be a positive number' 
    });
  }

  next();
};

module.exports = {
  // New comprehensive validation functions
  validateMobile,
  validateEmail,
  validateUserType,
  validatePassword,
  validateVehicleNumber,
  validateBookingTime,
  validateOrganizationMember,
  
  // Legacy validation functions for backward compatibility
  validateRegistration,
  validateLogin,
  validateBooking,
  validateOrganization
};
