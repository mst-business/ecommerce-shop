/**
 * Validation Middleware
 */
const { ValidationError } = require('./errorHandler');

/**
 * Validate required fields in request body
 */
function validateRequired(fields) {
  return (req, res, next) => {
    const missing = fields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
      throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
    }

    next();
  };
}

/**
 * Validate email format
 */
function validateEmail(field = 'email') {
  return (req, res, next) => {
    const email = req.body[field];
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ValidationError('Invalid email format');
      }
    }
    next();
  };
}

/**
 * Validate positive number
 */
function validatePositiveNumber(field, fieldName) {
  return (req, res, next) => {
    const value = req.body[field];
    if (value !== undefined) {
      const num = Number(value);
      if (isNaN(num) || num <= 0) {
        throw new ValidationError(`${fieldName || field} must be a positive number`);
      }
    }
    next();
  };
}

/**
 * Validate non-negative number
 */
function validateNonNegativeNumber(field, fieldName) {
  return (req, res, next) => {
    const value = req.body[field];
    if (value !== undefined) {
      const num = Number(value);
      if (isNaN(num) || num < 0) {
        throw new ValidationError(`${fieldName || field} must be a non-negative number`);
      }
    }
    next();
  };
}

/**
 * Validate array is not empty
 */
function validateNonEmptyArray(field, fieldName) {
  return (req, res, next) => {
    const value = req.body[field];
    if (!Array.isArray(value) || value.length === 0) {
      throw new ValidationError(`${fieldName || field} must be a non-empty array`);
    }
    next();
  };
}

/**
 * Validate enum value
 */
function validateEnum(field, allowedValues, fieldName) {
  return (req, res, next) => {
    const value = req.body[field];
    if (value && !allowedValues.includes(value)) {
      throw new ValidationError(
        `${fieldName || field} must be one of: ${allowedValues.join(', ')}`
      );
    }
    next();
  };
}

/**
 * Validate password strength
 */
function validatePassword(field = 'password', minLength = 6) {
  return (req, res, next) => {
    const password = req.body[field];
    if (password && password.length < minLength) {
      throw new ValidationError(`Password must be at least ${minLength} characters`);
    }
    next();
  };
}

/**
 * Validate rating (1-5)
 */
function validateRating(field = 'rating') {
  return (req, res, next) => {
    const rating = req.body[field];
    if (rating !== undefined) {
      const num = Number(rating);
      if (isNaN(num) || num < 1 || num > 5) {
        throw new ValidationError('Rating must be between 1 and 5');
      }
    }
    next();
  };
}

/**
 * Sanitize string input (trim whitespace)
 */
function sanitizeStrings(fields) {
  return (req, res, next) => {
    fields.forEach(field => {
      if (typeof req.body[field] === 'string') {
        req.body[field] = req.body[field].trim();
      }
    });
    next();
  };
}

/**
 * Combine multiple validators
 */
function validate(...validators) {
  return async (req, res, next) => {
    try {
      for (const validator of validators) {
        await new Promise((resolve, reject) => {
          validator(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  validateRequired,
  validateEmail,
  validatePositiveNumber,
  validateNonNegativeNumber,
  validateNonEmptyArray,
  validateEnum,
  validatePassword,
  validateRating,
  sanitizeStrings,
  validate,
};

