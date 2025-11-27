/**
 * Security Headers Middleware
 * Sets security-related HTTP headers to protect against common vulnerabilities
 */

/**
 * Security Headers Middleware
 * Implements basic security headers without external dependencies
 */
const securityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS filter in older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Control referrer information
  res.setHeader('Referrer-Policy', 'no-referrer');
  
  // Content Security Policy (basic)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self'"
  );
  
  // Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }
  
  // Remove X-Powered-By header (hide Express)
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * Alternative: Using helmet package (uncomment if helmet is installed)
 * 
 * const helmet = require('helmet');
 * module.exports = helmet();
 */

module.exports = securityHeaders;
