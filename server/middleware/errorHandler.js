/**
 * Global Error Handler Middleware
 */

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error
 */
class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super(404, `${resource} not found`);
  }
}

/**
 * Validation Error
 */
class ValidationError extends ApiError {
  constructor(message, details = null) {
    super(400, message, details);
  }
}

/**
 * Unauthorized Error
 */
class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required') {
    super(401, message);
  }
}

/**
 * Forbidden Error
 */
class ForbiddenError extends ApiError {
  constructor(message = 'Access denied') {
    super(403, message);
  }
}

/**
 * Conflict Error (e.g., duplicate resource)
 */
class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super(409, message);
  }
}

/**
 * Async handler wrapper to catch errors in async routes
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handling middleware
 */
function errorHandler(err, req, res, next) {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: 'Validation failed',
      details: messages,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      error: `${field} already exists`,
    });
  }

  // Mongoose cast error (invalid ID format)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // Custom API errors
  if (err instanceof ApiError) {
    const response = { error: err.message };
    if (err.details) {
      response.details = err.details;
    }
    return res.status(err.statusCode).json(response);
  }

  // Default to 500 server error
  return res.status(500).json({
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Internal server error',
  });
}

module.exports = {
  ApiError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  asyncHandler,
  errorHandler,
};


