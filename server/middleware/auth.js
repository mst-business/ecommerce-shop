/**
 * Authentication Middleware
 */
const User = require('../models/User');
const { sendError } = require('../utils/response');

/**
 * Basic authentication - requires user ID in headers
 */
function authenticate(req, res, next) {
  const userId = req.headers['x-user-id'] || req.body.userId;
  
  if (!userId) {
    return sendError(res, 401, 'Authentication required');
  }
  
  req.userId = parseInt(userId, 10);
  next();
}

/**
 * Admin authentication - checks if user is authenticated AND has admin role
 */
async function authenticateAdmin(req, res, next) {
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
 * Optional authentication - sets userId if provided, but doesn't require it
 */
function optionalAuth(req, res, next) {
  const userId = req.headers['x-user-id'] || req.body.userId;
  
  if (userId) {
    req.userId = parseInt(userId, 10);
  }
  
  next();
}

module.exports = {
  authenticate,
  authenticateAdmin,
  optionalAuth,
};

