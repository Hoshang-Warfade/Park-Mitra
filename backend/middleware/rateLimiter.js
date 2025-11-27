/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting number of requests per IP address
 */

// In-memory store for request counts
const requestStore = new Map();

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestStore.entries()) {
    if (data.resetTime < now) {
      requestStore.delete(ip);
    }
  }
}, 60000); // Clean up every minute

/**
 * Create rate limiter middleware with configurable options
 * @param {number} maxRequests - Maximum requests allowed in window
 * @param {number} windowMs - Time window in milliseconds
 * @param {string} message - Custom error message
 */
const createRateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000, message = 'Too many requests, please try again later.') => {
  return (req, res, next) => {
    // Get client IP
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Get or create entry for this IP
    let ipData = requestStore.get(ip);
    
    if (!ipData || ipData.resetTime < now) {
      // Create new entry or reset expired one
      ipData = {
        count: 1,
        resetTime: now + windowMs,
        firstRequest: now
      };
      requestStore.set(ip, ipData);
      return next();
    }
    
    // Increment request count
    ipData.count++;
    
    // Check if limit exceeded
    if (ipData.count > maxRequests) {
      const timeLeft = Math.ceil((ipData.resetTime - now) / 1000);
      
      return res.status(429).json({
        success: false,
        error: message,
        retryAfter: timeLeft,
        limit: maxRequests,
        current: ipData.count
      });
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - ipData.count);
    res.setHeader('X-RateLimit-Reset', new Date(ipData.resetTime).toISOString());
    
    next();
  };
};

/**
 * Pre-configured rate limiters for common use cases
 */
const rateLimiters = {
  // General API rate limiter
  general: createRateLimiter(1000, 15 * 60 * 1000),
  
  // Strict rate limiter for auth endpoints
  auth: createRateLimiter(500, 15 * 60 * 1000, 'Too many authentication requests, please try again later.'),
  
  // Moderate rate limiter for booking endpoints
  booking: createRateLimiter(1000, 15 * 60 * 1000, 'Too many booking requests, please try again later.'),
  
  // Lenient rate limiter for read-only endpoints
  readOnly: createRateLimiter(1000, 15 * 60 * 1000)
};

module.exports = {
  createRateLimiter,
  rateLimiters
};
