/**
 * Request Logging Middleware
 * Logs incoming HTTP requests with timestamp, method, URL, status, and response time
 */

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * Format timestamp
 */
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
};

/**
 * Get color based on status code
 */
const getStatusColor = (status) => {
  if (status >= 200 && status < 300) return colors.green;
  if (status >= 300 && status < 400) return colors.cyan;
  if (status >= 400 && status < 500) return colors.yellow;
  if (status >= 500) return colors.red;
  return colors.reset;
};

/**
 * Sanitize request body (remove sensitive data)
 */
const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'creditCard', 'ssn'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });
  
  return sanitized;
};

/**
 * Request Logger Middleware
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log incoming request
  console.log(
    `${colors.gray}[${getTimestamp()}]${colors.reset} ` +
    `${colors.cyan}${req.method}${colors.reset} ${req.originalUrl}`
  );
  
  // Log request body for POST/PUT/PATCH (sanitized)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const sanitizedBody = sanitizeBody(req.body);
    console.log(`  Body:`, JSON.stringify(sanitizedBody, null, 2));
  }
  
  // Log user info if authenticated
  if (req.user) {
    console.log(`  User: ${req.user.name} (ID: ${req.user.id}, Type: ${req.user.userType})`);
  }
  
  // Capture response
  const originalJson = res.json;
  res.json = function(data) {
    res.json = originalJson;
    
    const duration = Date.now() - startTime;
    const statusColor = getStatusColor(res.statusCode);
    
    // Log response
    console.log(
      `${colors.gray}[${getTimestamp()}]${colors.reset} ` +
      `${colors.cyan}${req.method}${colors.reset} ${req.originalUrl} ` +
      `${statusColor}${res.statusCode}${colors.reset} ` +
      `${colors.gray}${duration}ms${colors.reset}`
    );
    
    return res.json.call(this, data);
  };
  
  next();
};

module.exports = requestLogger;
