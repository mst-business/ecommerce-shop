/**
 * Authentication Middleware
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/response');
const { JWT } = require('../config/security');

/**
 * Generate access token
 */
function generateAccessToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username,
      role: user.role || 'customer',
    },
    JWT.SECRET,
    { 
      expiresIn: JWT.ACCESS_TOKEN_EXPIRY,
      algorithm: JWT.ALGORITHM,
    }
  );
}

/**
 * Generate refresh token
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id, type: 'refresh' },
    JWT.SECRET,
    { 
      expiresIn: JWT.REFRESH_TOKEN_EXPIRY,
      algorithm: JWT.ALGORITHM,
    }
  );
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT.SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

/**
 * Basic authentication middleware
 * Supports both JWT tokens and legacy x-user-id header
 */
async function authenticate(req, res, next) {
  // Try JWT token first
  const token = extractToken(req);
  
  if (token) {
    const decoded = verifyToken(token);
    
    if (decoded && decoded.userId) {
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      req.tokenData = decoded;
      return next();
    }
    
    // Invalid token
    return sendError(res, 401, 'Invalid or expired token');
  }
  
  // Fallback to legacy x-user-id header (for backwards compatibility)
  const userId = req.headers['x-user-id'] || req.body.userId;
  
  if (!userId) {
    return sendError(res, 401, 'Authentication required');
  }
  
  req.userId = parseInt(userId, 10);
  next();
}

/**
 * Admin authentication middleware
 * Checks if user is authenticated AND has admin role
 */
async function authenticateAdmin(req, res, next) {
  // Try JWT token first
  const token = extractToken(req);
  
  if (token) {
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return sendError(res, 401, 'Invalid or expired token');
    }
    
    if (decoded.role !== 'admin') {
      return sendError(res, 403, 'Admin access required');
    }
    
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.tokenData = decoded;
    return next();
  }
  
  // Fallback to legacy x-user-id header
  const userId = req.headers['x-user-id'] || req.body.userId;
  
  if (!userId) {
    return sendError(res, 401, 'Authentication required');
  }
  
  try {
    const user = await User.findOne({ id: parseInt(userId, 10) });
    
    if (!user) {
      return sendError(res, 401, 'User not found');
    }
    
    if (user.role !== 'admin') {
      return sendError(res, 403, 'Admin access required');
    }
    
    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

/**
 * Optional authentication
 * Sets userId if provided, but doesn't require it
 */
function optionalAuth(req, res, next) {
  // Try JWT token first
  const token = extractToken(req);
  
  if (token) {
    const decoded = verifyToken(token);
    
    if (decoded && decoded.userId) {
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      req.tokenData = decoded;
    }
    
    return next();
  }
  
  // Fallback to legacy x-user-id header
  const userId = req.headers['x-user-id'] || req.body.userId;
  
  if (userId) {
    req.userId = parseInt(userId, 10);
  }
  
  next();
}

/**
 * Refresh token middleware
 * Validates refresh token and issues new access token
 */
async function refreshAccessToken(req, res, next) {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return sendError(res, 400, 'Refresh token required');
  }
  
  const decoded = verifyToken(refreshToken);
  
  if (!decoded || decoded.type !== 'refresh') {
    return sendError(res, 401, 'Invalid or expired refresh token');
  }
  
  try {
    const user = await User.findOne({ id: decoded.userId });
    
    if (!user) {
      return sendError(res, 401, 'User not found');
    }
    
    // Generate new tokens
    req.newAccessToken = generateAccessToken(user);
    req.newRefreshToken = generateRefreshToken(user);
    req.user = user;
    
    next();
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

/**
 * Role-based access control
 * @param {string[]} allowedRoles - Array of allowed roles
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.userRole) {
      return sendError(res, 401, 'Authentication required');
    }
    
    if (!allowedRoles.includes(req.userRole)) {
      return sendError(res, 403, 'Insufficient permissions');
    }
    
    next();
  };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  extractToken,
  authenticate,
  authenticateAdmin,
  optionalAuth,
  refreshAccessToken,
  requireRole,
};
