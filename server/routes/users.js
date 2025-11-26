/**
 * User Routes
 */
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const User = require('../models/User');
const { getNextSequence } = require('../utils/getNextSequence');
const { sendSuccess } = require('../utils/response');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');
const { asyncHandler, NotFoundError, ValidationError, ConflictError, UnauthorizedError } = require('../middleware/errorHandler');
const { authenticate, generateAccessToken, generateRefreshToken, refreshAccessToken } = require('../middleware/auth');
const { validateRequired, validateEmail, validatePassword, sanitizeStrings } = require('../middleware/validate');
const { authLimiter } = require('../middleware/security');

const SALT_ROUNDS = 10;

/**
 * Remove password from user object
 */
function sanitizeUser(user) {
  const { password, ...userWithoutPassword } = user.toObject();
  return userWithoutPassword;
}

/**
 * POST /users/register - Register a new user
 */
router.post('/register',
  authLimiter, // Rate limit registration
  validateRequired(['username', 'password', 'email']),
  validateEmail('email'),
  validatePassword('password', 6),
  sanitizeStrings(['username', 'email', 'firstName', 'lastName']),
  asyncHandler(async (req, res) => {
    const { username, password, email, firstName, lastName } = req.body;
    
    // Check for existing user
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    
    if (existingUser) {
      throw new ConflictError('Username or email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const newUser = await User.create({
      id: await getNextSequence('user'),
      username,
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
    });

    return sendSuccess(res, 201, sanitizeUser(newUser), SUCCESS_MESSAGES.USER_REGISTERED);
  })
);

/**
 * POST /users/login - User login
 */
router.post('/login',
  authLimiter, // Rate limit login attempts
  validateRequired(['username', 'password']),
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Generate JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return sendSuccess(res, 200, {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
      // Keep legacy token for backwards compatibility
      token: accessToken,
    }, SUCCESS_MESSAGES.LOGIN_SUCCESS);
  })
);

/**
 * POST /users/refresh-token - Refresh access token
 */
router.post('/refresh-token',
  refreshAccessToken,
  asyncHandler(async (req, res) => {
    return sendSuccess(res, 200, {
      accessToken: req.newAccessToken,
      refreshToken: req.newRefreshToken,
      // Keep legacy token for backwards compatibility
      token: req.newAccessToken,
    }, 'Token refreshed successfully');
  })
);

/**
 * GET /users/profile - Get user profile
 */
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  const user = await User.findOne({ id: req.userId });
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  return sendSuccess(res, 200, sanitizeUser(user));
}));

/**
 * PUT /users/profile - Update user profile
 */
router.put('/profile',
  authenticate,
  validateEmail('email'),
  sanitizeStrings(['email', 'firstName', 'lastName']),
  asyncHandler(async (req, res) => {
    const { email, firstName, lastName } = req.body;

    // Check if email is already in use by another user
    if (email) {
      const emailInUse = await User.findOne({ email, id: { $ne: req.userId } });
      if (emailInUse) {
        throw new ConflictError('Email already in use');
      }
    }

    const update = {};
    if (email) update.email = email;
    if (firstName !== undefined) update.firstName = firstName;
    if (lastName !== undefined) update.lastName = lastName;

    const updatedUser = await User.findOneAndUpdate(
      { id: req.userId },
      { $set: update },
      { new: true }
    );

    if (!updatedUser) {
      throw new NotFoundError('User');
    }

    return sendSuccess(res, 200, sanitizeUser(updatedUser), SUCCESS_MESSAGES.PROFILE_UPDATED);
  })
);

/**
 * PUT /users/password - Change password
 */
router.put('/password',
  authenticate,
  validateRequired(['currentPassword', 'newPassword']),
  validatePassword('newPassword', 6),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findOne({ id: req.userId });
    if (!user) {
      throw new NotFoundError('User');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.password = hashedPassword;
    await user.save();

    return sendSuccess(res, 200, null, SUCCESS_MESSAGES.PASSWORD_CHANGED);
  })
);

module.exports = router;

