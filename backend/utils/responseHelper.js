// API Response Utilities - Standardized response formatting
// Use these functions in all route handlers for consistency

/**
 * Send a successful response
 * @param {Object} res - Express response object
 * @param {*} data - Response data (can be object, array, string, etc.)
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} JSON response
 */
const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @returns {Object} JSON response
 */
const errorResponse = (res, message = 'Internal server error', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error: message
  });
};

/**
 * Send a validation error response
 * @param {Object} res - Express response object
 * @param {Object|Array} errors - Validation errors object or array
 * @returns {Object} JSON response
 */
const validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    success: false,
    error: 'Validation failed',
    errors
  });
};

/**
 * Send a not found response
 * @param {Object} res - Express response object
 * @param {string} resourceName - Name of the resource that was not found
 * @returns {Object} JSON response
 */
const notFoundResponse = (res, resourceName = 'Resource') => {
  return res.status(404).json({
    success: false,
    error: `${resourceName} not found`
  });
};

/**
 * Send an unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message (default: 'Unauthorized access')
 * @returns {Object} JSON response
 */
const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return res.status(401).json({
    success: false,
    error: message
  });
};

/**
 * Send a forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden message (default: 'Access forbidden')
 * @returns {Object} JSON response
 */
const forbiddenResponse = (res, message = 'Access forbidden') => {
  return res.status(403).json({
    success: false,
    error: message
  });
};

/**
 * Send a conflict response (e.g., duplicate entry)
 * @param {Object} res - Express response object
 * @param {string} message - Conflict message
 * @returns {Object} JSON response
 */
const conflictResponse = (res, message = 'Resource already exists') => {
  return res.status(409).json({
    success: false,
    error: message
  });
};

/**
 * Send a bad request response
 * @param {Object} res - Express response object
 * @param {string} message - Bad request message
 * @returns {Object} JSON response
 */
const badRequestResponse = (res, message = 'Bad request') => {
  return res.status(400).json({
    success: false,
    error: message
  });
};

/**
 * Send a created response (for POST requests)
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 * @returns {Object} JSON response
 */
const createdResponse = (res, data = null, message = 'Resource created successfully') => {
  return res.status(201).json({
    success: true,
    message,
    data
  });
};

/**
 * Send a no content response (for DELETE requests)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
const noContentResponse = (res) => {
  return res.status(204).send();
};

/**
 * Send a paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {string} message - Success message
 * @returns {Object} JSON response
 */
const paginatedResponse = (res, data, page, limit, total, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
      totalItems: parseInt(total),
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  });
};

/**
 * Send a response with custom status code
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {boolean} success - Success flag
 * @param {string} message - Response message
 * @param {*} data - Response data (optional)
 * @returns {Object} JSON response
 */
const customResponse = (res, statusCode, success, message, data = null) => {
  const response = {
    success,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return res.status(statusCode).json(response);
};

// Export all response utilities
module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  conflictResponse,
  badRequestResponse,
  createdResponse,
  noContentResponse,
  paginatedResponse,
  customResponse
};
