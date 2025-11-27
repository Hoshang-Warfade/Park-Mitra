const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findByEmail, findById, verifyPassword, verifyOrganizationMember } = require('../models/User');
const { createOrganization } = require('../models/Organization');
const { verifyToken } = require('../middleware/auth');
const { validateRegistration, validateLogin, validateOrganization } = require('../middleware/validation');
const { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } = require('../middleware/errorHandler');
const { jwtConfig } = require('../config/auth.config');
const { runQuery, getRow } = require('../config/db');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', validateRegistration, async (req, res, next) => {
  try {
    let { name, email, mobile, password, user_type, organization_id, employee_id } = req.body;
    
    // � FIX: Convert empty strings to null (prevent FOREIGN KEY constraint violation)
    organization_id = organization_id === '' || organization_id === undefined ? null : organization_id;
    employee_id = employee_id === '' || employee_id === undefined ? null : employee_id;
    
    // �🔍 DETAILED LOGGING: Registration attempt
    console.log('\n' + '📝'.repeat(35));
    console.log('📝 USER REGISTRATION ATTEMPT');
    console.log('📝'.repeat(35));
    console.log('📝 Name:', name);
    console.log('📝 Email:', email);
    console.log('📝 Mobile:', mobile);
    console.log('📝 User Type:', user_type);
    console.log('📝 Organization ID:', organization_id === null ? 'NULL' : organization_id);
    console.log('📝 Employee ID:', employee_id === null ? 'NULL' : employee_id);
    console.log('📝'.repeat(35) + '\n');
    
    // Validate mobile (10 digits)
    if (!/^\d{10}$/.test(mobile)) {
      throw new BadRequestError('Mobile number must be exactly 10 digits');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestError('Invalid email format');
    }
    
    // Validate password strength (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestError('Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number');
    }
    
    // Validate user_type
    const validUserTypes = ['visitor', 'organization_member', 'walk_in'];
    if (!validUserTypes.includes(user_type)) {
      throw new BadRequestError('Invalid user_type. Must be: visitor, organization_member, or walk_in');
    }
    
    // Check if email already exists
    console.log('🔍 Checking for duplicate email...');
    const existingUser = await findByEmail(email);
    if (existingUser) {
      console.log('❌ Email already exists:', email);
      throw new ConflictError('This email address is already registered. Please use a different email or try logging in.');
    }
    console.log('✅ Email available');
    
    // Check if mobile already exists
    console.log('🔍 Checking for duplicate mobile...');
    const { findByMobile } = require('../models/User');
    const existingMobile = await findByMobile(mobile);
    if (existingMobile) {
      console.log('❌ Mobile already exists:', mobile);
      throw new ConflictError('This mobile number is already registered. Please use a different number or try logging in.');
    }
    console.log('✅ Mobile available');
    
    // If user_type is 'organization_member', require organization_id and employee_id
    if (user_type === 'organization_member') {
      if (!organization_id || !employee_id) {
        throw new BadRequestError('organization_id and employee_id are required for organization members');
      }
      
      // 🔍 Verify organization exists (prevent FOREIGN KEY constraint)
      console.log('🔍 Verifying organization exists:', organization_id);
      const { getOrganizationById } = require('../models/Organization');
      const organization = await getOrganizationById(organization_id);
      if (!organization) {
        console.log('❌ Organization not found:', organization_id);
        throw new BadRequestError(`Organization with ID ${organization_id} does not exist. Please select a valid organization.`);
      }
      console.log('✅ Organization exists:', organization.org_name);
    }
    
    // Create user (password will be hashed automatically)
    console.log('📝 Creating user in database...');
    const user = await createUser(name, email, mobile, password, user_type, organization_id, employee_id);
    console.log('✅ User created successfully with ID:', user.id);
    
    // Return success with user data (no password)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * User login - Supports email or employee_id
 */
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password, organization_id } = req.body;
    const identifier = email; // Can be email or employee_id
    
    console.log('[LOGIN] Identifier:', identifier);
    console.log('[LOGIN] Organization ID:', organization_id);
    console.log('[LOGIN] Password provided:', !!password);
    console.log('[LOGIN] Password length:', password ? password.length : 0);
    
    // Validate identifier and password present
    if (!identifier || !password) {
      throw new BadRequestError('Email/Employee ID and password are required');
    }
    
    // Check if identifier is email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(identifier);
    
    let user = null;
    let isWatchman = false;
    
    // Try to find user by email or employee_id in users table
    if (isEmail) {
      user = await verifyPassword(identifier, password);
    } else {
      // Try employee_id login for organization_member
      // If organization_id is provided, filter by it to prevent conflicts
      let query = 'SELECT * FROM users WHERE employee_id = ?';
      let params = [identifier];
      
      if (organization_id) {
        query += ' AND organization_id = ?';
        params.push(organization_id);
      }
      
      const userByEmployeeId = await getRow(query, params);
      
      console.log('[LOGIN] User found by employee_id:', !!userByEmployeeId);
      
      if (userByEmployeeId) {
        // Check if password field exists (users table uses 'password', not 'password_hash')
        const passwordField = userByEmployeeId.password || userByEmployeeId.password_hash;
        
        console.log('[LOGIN] Password field exists:', !!passwordField);
        console.log('[LOGIN] Password field length:', passwordField ? passwordField.length : 0);
        console.log('[LOGIN] Input password exists:', !!password);
        console.log('[LOGIN] Input password length:', password ? password.length : 0);
        
        if (!passwordField) {
          console.error('User password field is missing for:', identifier);
          throw new UnauthorizedError('Invalid credentials');
        }
        
        if (!password) {
          console.error('Input password is empty');
          throw new BadRequestError('Password is required');
        }
        
        // Verify password
        console.log('[LOGIN] Attempting password comparison...');
        const passwordMatch = await bcrypt.compare(password, passwordField);
        console.log('[LOGIN] Password match result:', passwordMatch);
        
        if (passwordMatch) {
          user = userByEmployeeId;
        }
      }
    }
    
    // If not found in users table, check watchmen table (by email or employee_id)
    if (!user) {
      let watchman = null;
      
      if (isEmail) {
        watchman = await getRow('SELECT * FROM watchmen WHERE email = ?', [identifier]);
      } else {
        // Filter watchmen by organization_id if provided
        let query = 'SELECT * FROM watchmen WHERE employee_id = ?';
        let params = [identifier];
        
        if (organization_id) {
          query += ' AND organization_id = ?';
          params.push(organization_id);
        }
        
        watchman = await getRow(query, params);
      }
      
      if (watchman) {
        // Check if password_hash exists
        if (!watchman.password_hash) {
          console.error('Watchman password_hash is missing for:', identifier);
          throw new UnauthorizedError('Invalid credentials');
        }
        
        // Check if password is provided
        if (!password) {
          console.error('Password is empty or undefined');
          throw new BadRequestError('Password is required');
        }
        
        // Verify watchman password
        const passwordMatch = await bcrypt.compare(password, watchman.password_hash);
        
        if (passwordMatch) {
          user = {
            id: watchman.id,
            name: watchman.name,
            email: watchman.email,
            mobile: watchman.mobile,
            employee_id: watchman.employee_id,
            user_type: 'watchman',
            organization_id: watchman.organization_id,
            created_at: watchman.created_at
          };
          isWatchman = true;
        }
      }
    }
    
    // If invalid credentials
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }
    
    // Check if user is an organization admin (email matches organization admin_email)
    if (!isWatchman && user.user_type === 'organization_member') {
      const { getRow } = require('../config/db');
      const organization = await getRow(
        'SELECT * FROM organizations WHERE admin_email = ? AND id = ?',
        [user.email, user.organization_id]
      );
      
      if (organization) {
        // This user is the organization admin
        user.user_type = 'admin';
        user.is_admin = true;
      }
    }
    
    // Generate JWT token
    const payload = {
      user_id: user.id,
      email: user.email,
      user_type: user.user_type,
      organization_id: user.organization_id,
      is_watchman: isWatchman
    };
    
    const token = jwt.sign(payload, jwtConfig.secret, { 
      expiresIn: jwtConfig.expiresIn,
      algorithm: jwtConfig.algorithm,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });
    
    // Return token and user data
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/register-organization
 * Register a new organization with admin user
 */
router.post('/register-organization', validateOrganization, async (req, res, next) => {
  try {
    const {
      // Organization fields
      org_name,
      admin_name,
      admin_email,
      admin_mobile,
      admin_password,
      address,
      total_slots,
      visitor_hourly_rate,
      parking_rules,
      operating_hours,
      member_parking_free,
      parking_lots // NEW: Array of parking lots
    } = req.body;
    
    // Validate all organization fields
    if (!org_name || !admin_name || !admin_email || !admin_mobile || !admin_password) {
      throw new BadRequestError('All organization and admin fields are required');
    }
    
    if (!address || !total_slots || !visitor_hourly_rate) {
      throw new BadRequestError('Address, total_slots, and visitor_hourly_rate are required');
    }
    
    // Validate admin mobile
    if (!/^\d{10}$/.test(admin_mobile)) {
      throw new BadRequestError('Admin mobile number must be exactly 10 digits');
    }
    
    // Validate admin email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(admin_email)) {
      throw new BadRequestError('Invalid admin email format');
    }
    
    // Validate admin password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(admin_password)) {
      throw new BadRequestError('Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number');
    }
    
    // Check if admin email already exists
    const existingUser = await findByEmail(admin_email);
    if (existingUser) {
      throw new ConflictError('Admin email already registered');
    }
    
    // Create organization (with parking lots if provided)
    const organization = await createOrganization(
      org_name,
      admin_name,
      admin_email,
      admin_mobile,
      address,
      total_slots,
      visitor_hourly_rate,
      parking_rules,
      parking_lots // Pass parking lots array
    );
    
    // Create admin user with user_type = 'organization_member'
    const adminUser = await createUser(
      admin_name,
      admin_email,
      admin_mobile,
      admin_password,
      'organization_member',
      organization.id,
      'ADMIN001' // Default admin employee ID
    );
    
    // Return success with organization and admin details
    res.status(201).json({
      success: true,
      message: 'Organization registered successfully',
      data: {
        organization,
        admin: adminUser
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/verify-member
 * Verify if user is a valid organization member
 * This prevents visitors from getting free parking by faking identity
 */
router.post('/verify-member', verifyToken, async (req, res, next) => {
  try {
    const { user_id, organization_id } = req.body;
    
    if (!user_id || !organization_id) {
      throw new BadRequestError('user_id and organization_id are required');
    }
    
    // Call User.verifyOrganizationMember
    const isValid = await verifyOrganizationMember(user_id, organization_id);
    
    // Return verification result
    res.json({
      success: true,
      data: {
        is_valid_member: isValid
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/profile
 * Get authenticated user profile
 */
router.get('/profile', verifyToken, async (req, res, next) => {
  try {
    // Get user_id from req.user (set by verifyToken middleware)
    const user_id = req.user.user_id;
    
    // Get user profile
    const user = await findById(user_id);
    
    // Handle not found
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Return user profile data
    res.json({
      success: true,
      data: {
        user
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', verifyToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user_id = req.user.user_id;
    
    // Validate inputs
    if (!currentPassword || !newPassword) {
      throw new BadRequestError('Current password and new password are required');
    }
    
    // Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new BadRequestError('New password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number');
    }
    
    // Get user with password (findById doesn't return password field)
    const user = await getRow('SELECT * FROM users WHERE id = ?', [user_id]);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password in database
    await runQuery(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, user_id]
    );
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;
