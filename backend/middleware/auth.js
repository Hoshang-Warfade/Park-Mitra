const jwt = require('jsonwebtoken');
const { jwtConfig } = require('../config/auth.config');
const { getRow } = require('../config/db');

/**
 * Verify JWT Token Middleware
 * Extracts and validates JWT token from Authorization header
 */
const verifyToken = (req, res, next) => {
  // Extract token from Authorization header (Bearer token)
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ 
      error: 'Access denied. No token provided' 
    });
  }

  // Extract Bearer token
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;

  if (!token) {
    return res.status(401).json({ 
      error: 'Access denied. No token provided' 
    });
  }

  try {
    // Verify token using jwt.verify with JWT_SECRET
    const decoded = jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });

    // Decode user data (user_id, email, user_type)
    // Attach decoded user to req.user
    req.user = {
      id: decoded.id || decoded.user_id,
      user_id: decoded.id || decoded.user_id,
      email: decoded.email,
      user_type: decoded.user_type || decoded.userType,
      organization_id: decoded.organization_id || decoded.organizationId,
      employee_id: decoded.employee_id || decoded.employeeId
    };

    // Call next() if valid
    next();
  } catch (error) {
    // Return 401 if token invalid or expired
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired. Please login again' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token. Authentication failed' 
      });
    }

    return res.status(401).json({ 
      error: 'Token verification failed' 
    });
  }
};

/**
 * Check User Type Middleware Factory
 * Returns middleware that checks if user type is in allowed array
 * 
 * @param {Array<string>} allowedUserTypes - Array of allowed user types
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.post('/bookings', verifyToken, checkUserType(['organization_member', 'visitor']), createBooking)
 */
const checkUserType = (allowedUserTypes) => {
  return (req, res, next) => {
    // Check if req.user exists (verifyToken should run first)
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    // Check if req.user.user_type is in allowed array
    if (!allowedUserTypes.includes(req.user.user_type)) {
      return res.status(403).json({ 
        error: 'Access forbidden for your user type' 
      });
    }

    // Call next() if authorized
    next();
  };
};

/**
 * Check Organization Admin Middleware
 * Verifies user is admin of the specified organization
 */
const checkOrgAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    // Get organization_id from request (body, params, or query)
    const organizationId = req.body.organization_id 
      || req.params.organization_id 
      || req.query.organization_id
      || req.params.orgId
      || req.params.id;

    if (!organizationId) {
      return res.status(400).json({ 
        error: 'Organization ID is required' 
      });
    }

    // Query organizations table to verify user is admin
    const organization = await getRow(
      'SELECT * FROM organizations WHERE id = ?',
      [organizationId]
    );

    if (!organization) {
      return res.status(404).json({ 
        error: 'Organization not found' 
      });
    }

    // Check if user's email matches admin email
    if (organization.admin_email !== req.user.email) {
      return res.status(403).json({ 
        error: 'Access forbidden. You are not the admin of this organization' 
      });
    }

    // Attach organization to request for downstream use
    req.organization = organization;

    // Call next() if verified
    next();
  } catch (error) {
    console.error('Error checking organization admin:', error);
    return res.status(500).json({ 
      error: 'Failed to verify organization admin status' 
    });
  }
};

/**
 * Check Watchman Middleware
 * Verifies user has active watchman role
 */
const checkWatchman = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    // Check watchman table for active watchman by email
    const watchman = await getRow(
      'SELECT * FROM watchmen WHERE email = ? AND is_active = 1',
      [req.user.email]
    );

    // Return 403 if not valid watchman
    if (!watchman) {
      return res.status(403).json({ 
        error: 'Access forbidden. Valid watchman credentials required' 
      });
    }

    // Attach watchman details to request
    req.watchman = watchman;

    // Call next() if verified
    next();
  } catch (error) {
    console.error('Error checking watchman status:', error);
    return res.status(500).json({ 
      error: 'Failed to verify watchman status' 
    });
  }
};

// ============================================================================
// Legacy Middleware Functions (for backward compatibility)
// ============================================================================

/**
 * Check if user is an organization admin (legacy)
 */
const isOrgAdmin = (req, res, next) => {
  if (req.userType !== 'org_admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Require Organization Admin role' 
    });
  }
  next();
};

/**
 * Check if user is a watchman (legacy)
 */
const isWatchman = (req, res, next) => {
  if (req.userType !== 'watchman') {
    return res.status(403).json({ 
      success: false, 
      message: 'Require Watchman role' 
    });
  }
  next();
};

/**
 * Check if user is a member (legacy)
 */
const isMember = (req, res, next) => {
  if (req.userType !== 'member' && req.userType !== 'org_admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Require Member role' 
    });
  }
  next();
};

/**
 * Check if user has any of the specified roles (legacy)
 */
const hasRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userType)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }
    next();
  };
};

module.exports = {
  // New comprehensive authentication middleware
  verifyToken,
  checkUserType,
  checkOrgAdmin,
  checkWatchman,
  
  // Legacy middleware for backward compatibility
  isOrgAdmin,
  isWatchman,
  isMember,
  hasRole
};
