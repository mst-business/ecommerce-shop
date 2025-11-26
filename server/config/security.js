/**
 * Security Configuration
 */

// Rate limiting configurations
const RATE_LIMIT = {
  // General API rate limit
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // Stricter limit for authentication endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { error: 'Too many login attempts, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
  },
  
  // Admin endpoints
  ADMIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per window
    message: { error: 'Too many admin requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // Create operations (products, orders, etc.)
  CREATE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // 30 creates per hour
    message: { error: 'Too many create requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  },
};

// JWT Configuration
const JWT = {
  SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  ACCESS_TOKEN_EXPIRY: '15m', // 15 minutes
  REFRESH_TOKEN_EXPIRY: '7d', // 7 days
  ALGORITHM: 'HS256',
};

// CORS Configuration
const CORS = {
  ALLOWED_ORIGINS: [
    process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  ],
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'x-user-id', 'x-request-id'],
  CREDENTIALS: true,
  MAX_AGE: 86400, // 24 hours
};

// Helmet Configuration
const HELMET = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding images from external sources
  crossOriginResourcePolicy: { policy: 'cross-origin' },
};

// Request Size Limits
const REQUEST_LIMITS = {
  JSON_LIMIT: '10kb', // Max JSON body size
  URL_ENCODED_LIMIT: '10kb', // Max URL-encoded body size
  PARAMETER_LIMIT: 50, // Max number of parameters
};

// Sensitive fields to never log or return
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'refreshToken',
  'accessToken',
  'apiKey',
  'secret',
  'creditCard',
  'cvv',
  'ssn',
];

// IP Whitelist for admin (optional)
const ADMIN_IP_WHITELIST = process.env.ADMIN_IP_WHITELIST 
  ? process.env.ADMIN_IP_WHITELIST.split(',').map(ip => ip.trim())
  : null; // null means no IP restriction

module.exports = {
  RATE_LIMIT,
  JWT,
  CORS,
  HELMET,
  REQUEST_LIMITS,
  SENSITIVE_FIELDS,
  ADMIN_IP_WHITELIST,
};


