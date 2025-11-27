/**
 * Parse SQLite Constraint Error Details
 * Extracts table, column, and constraint type from error message
 * 
 * @param {Error} err - SQLite error object
 * @param {Object} req - Express request object
 * @returns {Object} Parsed constraint information
 */
const parseConstraintError = (err, req) => {
  const info = {
    type: 'UNKNOWN',
    table: 'unknown',
    column: 'unknown',
    relatedTable: null,
    sql: err.sql || null,
    values: err.params || null
  };
  
  const message = err.message || '';
  
  // Parse FOREIGN KEY constraint
  // Example: "FOREIGN KEY constraint failed"
  // Example: "SQLITE_CONSTRAINT: FOREIGN KEY constraint failed"
  if (message.includes('FOREIGN KEY') || err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    info.type = 'FOREIGN KEY';
    
    // Try to extract table and column from SQL or request
    const urlParts = req.originalUrl.split('/');
    if (urlParts.includes('bookings')) {
      info.table = 'bookings';
      // Check request body for foreign key fields
      if (req.body.user_id) info.column = 'user_id';
      if (req.body.organization_id) info.column = 'organization_id';
    } else if (urlParts.includes('users')) {
      info.table = 'users';
      if (req.body.organization_id) info.column = 'organization_id';
    } else if (urlParts.includes('watchmen')) {
      info.table = 'watchmen';
      if (req.body.organization_id) info.column = 'organization_id';
    }
  }
  
  // Parse NOT NULL constraint
  // Example: "NOT NULL constraint failed: users.email"
  if (message.includes('NOT NULL') || err.code === 'SQLITE_CONSTRAINT_NOTNULL') {
    info.type = 'NOT NULL';
    
    const match = message.match(/NOT NULL constraint failed: (\w+)\.(\w+)/);
    if (match) {
      info.table = match[1];
      info.column = match[2];
    }
  }
  
  // Parse UNIQUE constraint
  // Example: "UNIQUE constraint failed: users.email"
  if (message.includes('UNIQUE') || err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    info.type = 'UNIQUE';
    
    const match = message.match(/UNIQUE constraint failed: (\w+)\.(\w+)/);
    if (match) {
      info.table = match[1];
      info.column = match[2];
    }
  }
  
  // Parse CHECK constraint
  // Example: "CHECK constraint failed: check_positive_amount"
  if (message.includes('CHECK') || err.code === 'SQLITE_CONSTRAINT_CHECK') {
    info.type = 'CHECK';
    
    const match = message.match(/CHECK constraint failed: (\w+)/);
    if (match) {
      info.column = match[1];
    }
  }
  
  return info;
};

/**
 * Centralized Error Handling Middleware
 * Handles all types of errors with appropriate status codes and responses
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Log error stack in development mode
  if (process.env.NODE_ENV === 'development') {
    console.error('\n' + '='.repeat(70));
    console.error('❌ ERROR OCCURRED');
    console.error('='.repeat(70));
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Code:', err.code);
    console.error('Status Code:', err.statusCode);
    console.error('Stack Trace:\n', err.stack);
    console.error('Request URL:', req.originalUrl);
    console.error('Request Method:', req.method);
    console.error('Request Body:', JSON.stringify(req.body, null, 2));
    console.error('='.repeat(70) + '\n');
  } else {
    // Log minimal error in production
    console.error(`[${new Date().toISOString()}] ${err.name}: ${err.message}`);
  }

  // Default error status and message
  let statusCode = err.statusCode || 500;
  let errorMessage = err.message || 'Internal Server Error';

  // ============================================================================
  // Handle JWT Errors -> 401 Unauthorized
  // ============================================================================
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorMessage = 'Invalid token. Authentication failed';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorMessage = 'Token expired. Please login again';
  }

  if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorMessage = 'Unauthorized access';
  }

  // ============================================================================
  // Handle Validation Errors -> 400 Bad Request
  // ============================================================================
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = err.message || 'Validation failed';
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    errorMessage = `Invalid ${err.path}: ${err.value}`;
  }

  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    errorMessage = 'Invalid JSON format';
  }

  // ============================================================================
  // Handle Database Errors -> 500 Internal Server Error
  // ============================================================================
  if (err.code === 'SQLITE_ERROR') {
    statusCode = 500;
    errorMessage = 'Database error occurred';
  }

  // ============================================================================
  // DETAILED CONSTRAINT VIOLATION LOGGING
  // ============================================================================
  if (err.code === 'SQLITE_CONSTRAINT') {
    statusCode = 409;
    
    // Extract detailed constraint information
    const constraintInfo = parseConstraintError(err, req);
    
    // Log detailed constraint violation
    console.error('\n' + '🔴'.repeat(35));
    console.error('🔴 DATABASE CONSTRAINT VIOLATION DETECTED 🔴');
    console.error('🔴'.repeat(35));
    console.error('⚠️  Error Code:', err.code);
    console.error('⚠️  Error Message:', err.message);
    console.error('⚠️  Constraint Type:', constraintInfo.type);
    console.error('⚠️  Table:', constraintInfo.table);
    console.error('⚠️  Column:', constraintInfo.column);
    console.error('⚠️  Request URL:', req.originalUrl);
    console.error('⚠️  Request Method:', req.method);
    console.error('⚠️  Request Body:', JSON.stringify(req.body, null, 2));
    console.error('⚠️  User ID:', req.user?.id || 'Not authenticated');
    if (constraintInfo.sql) {
      console.error('⚠️  SQL Query:', constraintInfo.sql);
    }
    if (constraintInfo.values) {
      console.error('⚠️  Values:', JSON.stringify(constraintInfo.values, null, 2));
    }
    console.error('🔴'.repeat(35) + '\n');
    
    // Set specific error message based on constraint type
    if (constraintInfo.type === 'FOREIGN KEY') {
      errorMessage = `Foreign key constraint failed: ${constraintInfo.column} references non-existent record in ${constraintInfo.relatedTable || 'related table'}`;
    } else if (constraintInfo.type === 'NOT NULL') {
      errorMessage = `Required field missing: ${constraintInfo.column} cannot be NULL`;
    } else if (constraintInfo.type === 'UNIQUE') {
      errorMessage = `Duplicate entry: ${constraintInfo.column} already exists`;
    } else if (constraintInfo.type === 'CHECK') {
      errorMessage = `Check constraint failed: ${constraintInfo.column} violates validation rule`;
    } else {
      errorMessage = `Database constraint violation: ${err.message}`;
    }
    
    // Add detailed info to response in development
    if (process.env.NODE_ENV === 'development') {
      err.constraintDetails = constraintInfo;
    }
  }

  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    statusCode = 409;
    const constraintInfo = parseConstraintError(err, req);
    errorMessage = `Duplicate entry: ${constraintInfo.column} already exists`;
    
    console.error('🔴 UNIQUE CONSTRAINT:', constraintInfo.table + '.' + constraintInfo.column);
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    statusCode = 409;
    const constraintInfo = parseConstraintError(err, req);
    errorMessage = `Foreign key constraint failed: ${constraintInfo.column} references non-existent record`;
    
    console.error('🔴 FOREIGN KEY CONSTRAINT:', constraintInfo.table + '.' + constraintInfo.column);
  }
  
  if (err.code === 'SQLITE_CONSTRAINT_NOTNULL') {
    statusCode = 400;
    const constraintInfo = parseConstraintError(err, req);
    errorMessage = `Required field missing: ${constraintInfo.column} cannot be NULL`;
    
    console.error('🔴 NOT NULL CONSTRAINT:', constraintInfo.table + '.' + constraintInfo.column);
  }
  
  if (err.code === 'SQLITE_CONSTRAINT_CHECK') {
    statusCode = 400;
    const constraintInfo = parseConstraintError(err, req);
    errorMessage = `Validation failed: ${constraintInfo.column} violates check constraint`;
    
    console.error('🔴 CHECK CONSTRAINT:', constraintInfo.table + '.' + constraintInfo.column);
  }

  if (err.code === 'SQLITE_BUSY') {
    statusCode = 503;
    errorMessage = 'Database is busy. Please try again';
  }

  if (err.code === 'SQLITE_LOCKED') {
    statusCode = 503;
    errorMessage = 'Database is locked. Please try again';
  }

  if (err.code === 'SQLITE_CORRUPT') {
    statusCode = 500;
    errorMessage = 'Database corruption detected';
  }

  if (err.errno === 'ECONNREFUSED') {
    statusCode = 503;
    errorMessage = 'Database connection refused';
  }

  // ============================================================================
  // Handle Not Found Errors -> 404 Not Found
  // ============================================================================
  if (err.name === 'NotFoundError' || err.statusCode === 404) {
    statusCode = 404;
    errorMessage = err.message || 'Resource not found';
  }

  // ============================================================================
  // Handle Custom Application Errors
  // ============================================================================
  if (err.name === 'BadRequestError') {
    statusCode = 400;
    errorMessage = err.message || 'Bad request';
  }

  if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorMessage = err.message || 'Access forbidden';
  }

  if (err.name === 'ConflictError') {
    statusCode = 409;
    errorMessage = err.message || 'Resource conflict';
  }

  // ============================================================================
  // Handle Multer (File Upload) Errors
  // ============================================================================
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      errorMessage = 'File size too large';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      errorMessage = 'Too many files';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      errorMessage = 'Unexpected file field';
    } else {
      errorMessage = 'File upload error';
    }
  }

  // ============================================================================
  // Default to 500 status code if not specified
  // ============================================================================
  if (!statusCode || statusCode < 100 || statusCode > 599) {
    statusCode = 500;
  }

  // ============================================================================
  // Return JSON response
  // ============================================================================
  const response = {
    success: false,
    error: errorMessage
  };

  // Include stack trace and details in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = {
      name: err.name,
      code: err.code,
      statusCode: err.statusCode,
      path: err.path,
      value: err.value
    };
    
    // Add constraint details if available
    if (err.constraintDetails) {
      response.constraint = err.constraintDetails;
    }
  }

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found Handler
 * Handles requests to undefined routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  error.name = 'NotFoundError';
  next(error); // Pass to error handler
};

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.findAll();
 *   res.json(users);
 * }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom Error Classes
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation Failed') {
    super(message, 400);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database Error') {
    super(message, 500);
  }
}

// Export error handler and utilities
module.exports = errorHandler;
module.exports.notFound = notFound;
module.exports.asyncHandler = asyncHandler;

// Export custom error classes
module.exports.AppError = AppError;
module.exports.BadRequestError = BadRequestError;
module.exports.UnauthorizedError = UnauthorizedError;
module.exports.ForbiddenError = ForbiddenError;
module.exports.NotFoundError = NotFoundError;
module.exports.ConflictError = ConflictError;
module.exports.ValidationError = ValidationError;
module.exports.DatabaseError = DatabaseError;
