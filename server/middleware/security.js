/**
 * Security Middleware
 */
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const crypto = require('crypto');

const { RATE_LIMIT, HELMET, REQUEST_LIMITS, SENSITIVE_FIELDS } = require('../config/security');

/**
 * Helmet middleware with custom configuration
 * Sets various HTTP headers for security
 */
const helmetMiddleware = helmet(HELMET);

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit(RATE_LIMIT.API);

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit(RATE_LIMIT.AUTH);

/**
 * Rate limiter for admin endpoints
 */
const adminLimiter = rateLimit(RATE_LIMIT.ADMIN);

/**
 * Rate limiter for create operations
 */
const createLimiter = rateLimit(RATE_LIMIT.CREATE);

/**
 * MongoDB query sanitization
 * Prevents NoSQL injection by removing $ and . from user input
 */
const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[Security] Sanitized key "${key}" in request from ${req.ip}`);
  },
});

/**
 * HTTP Parameter Pollution protection
 * Prevents duplicate query parameters
 */
const hppMiddleware = hpp({
  whitelist: [
    'categoryId',
    'minPrice',
    'maxPrice',
    'page',
    'limit',
    'sort',
    'status',
  ],
});

/**
 * Request ID middleware
 * Adds unique ID to each request for tracking
 */
function requestId(req, res, next) {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
}

/**
 * Custom XSS sanitization
 * Removes dangerous HTML/script content from string inputs
 */
function sanitizeInput(obj) {
  if (typeof obj === 'string') {
    // Remove script tags and common XSS patterns
    return obj
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*on\w+\s*=\s*["'][^"']*["'][^>]*>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, 'data_')
      .replace(/vbscript:/gi, '')
      .trim();
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeInput);
  }
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return obj;
}

/**
 * XSS protection middleware
 */
function xssProtection(req, res, next) {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }
  if (req.params) {
    req.params = sanitizeInput(req.params);
  }
  next();
}

/**
 * Sensitive data filter
 * Removes sensitive fields from response data
 */
function filterSensitiveData(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(filterSensitiveData);
  }
  
  const filtered = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      continue; // Skip sensitive fields
    }
    filtered[key] = typeof value === 'object' ? filterSensitiveData(value) : value;
  }
  return filtered;
}

/**
 * Security headers middleware
 * Adds additional security headers not covered by Helmet
 */
function securityHeaders(req, res, next) {
  // Prevent caching of sensitive data
  if (req.path.includes('/users') || req.path.includes('/orders')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
}

/**
 * Request logging middleware
 * Logs incoming requests (without sensitive data)
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  
  // Log request
  const logData = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.headers['x-user-id'] || 'anonymous',
  };
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    
    console[level](`[${new Date().toISOString()}] ${logData.method} ${logData.path} ${res.statusCode} ${duration}ms - ${logData.ip}`);
    
    // Log security events
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn(`[Security] Unauthorized access attempt: ${JSON.stringify(logData)}`);
    }
    if (res.statusCode === 429) {
      console.warn(`[Security] Rate limit exceeded: ${JSON.stringify(logData)}`);
    }
  });
  
  next();
}

/**
 * Block suspicious requests
 * Checks for common attack patterns
 */
function blockSuspiciousRequests(req, res, next) {
  const suspiciousPatterns = [
    /\.\.\//g, // Path traversal
    /<script>/gi, // XSS attempts
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/gi, // SQL injection patterns
    /\$where/gi, // MongoDB injection
    /\$gt|\$lt|\$ne|\$eq/gi, // MongoDB operators in unexpected places
  ];
  
  const checkValue = (value) => {
    if (typeof value !== 'string') return false;
    return suspiciousPatterns.some(pattern => pattern.test(value));
  };
  
  // Check URL
  if (checkValue(req.originalUrl)) {
    console.warn(`[Security] Blocked suspicious URL: ${req.originalUrl} from ${req.ip}`);
    return res.status(400).json({ error: 'Invalid request' });
  }
  
  // Check query parameters
  for (const [key, value] of Object.entries(req.query)) {
    if (checkValue(key) || checkValue(value)) {
      console.warn(`[Security] Blocked suspicious query: ${key}=${value} from ${req.ip}`);
      return res.status(400).json({ error: 'Invalid request' });
    }
  }
  
  next();
}

/**
 * Combine all security middleware
 */
function applySecurityMiddleware(app) {
  // Request ID first (for tracking)
  app.use(requestId);
  
  // Helmet security headers
  app.use(helmetMiddleware);
  
  // Additional security headers
  app.use(securityHeaders);
  
  // Request logging
  app.use(requestLogger);
  
  // Block suspicious requests
  app.use(blockSuspiciousRequests);
  
  // XSS protection
  app.use(xssProtection);
  
  // MongoDB sanitization
  app.use(mongoSanitizeMiddleware);
  
  // HPP protection
  app.use(hppMiddleware);
  
  // General rate limiting
  app.use('/api', apiLimiter);
}

module.exports = {
  helmetMiddleware,
  apiLimiter,
  authLimiter,
  adminLimiter,
  createLimiter,
  mongoSanitizeMiddleware,
  hppMiddleware,
  requestId,
  xssProtection,
  securityHeaders,
  requestLogger,
  blockSuspiciousRequests,
  filterSensitiveData,
  applySecurityMiddleware,
};


