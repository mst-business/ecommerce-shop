/**
 * Rating Routes
 */
const express = require('express');
const router = express.Router();

const Product = require('../models/Product');
const Rating = require('../models/Rating');
const User = require('../models/User');
const Order = require('../models/Order');
const { getNextSequence } = require('../utils/getNextSequence');
const { sendSuccess } = require('../utils/response');
const { parsePagination, createPaginationMeta } = require('../utils/pagination');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');

/**
 * Enrich ratings with user information
 */
async function enrichRatingsWithUsers(ratings) {
  const userIds = [...new Set(ratings.map(r => r.userId))];
  const users = await User.find({ id: { $in: userIds } }).select('id username firstName lastName');
  
  const userMap = users.reduce((map, user) => {
    map[user.id] = {
      username: user.username,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username,
    };
    return map;
  }, {});

  return ratings.map(rating => ({
    ...rating.toObject(),
    user: userMap[rating.userId] || { username: 'Anonymous', name: 'Anonymous' },
  }));
}

/**
 * GET /products/:id/ratings - Get ratings for a product
 */
router.get('/products/:id/ratings', asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  const { page, limit, skip } = parsePagination(req.query);
  
  const product = await Product.findOne({ id: productId });
  if (!product) {
    throw new NotFoundError('Product');
  }

  const [ratings, total] = await Promise.all([
    Rating.find({ productId }).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Rating.countDocuments({ productId }),
  ]);

  const enrichedRatings = await enrichRatingsWithUsers(ratings);

  return sendSuccess(res, 200, {
    ratings: enrichedRatings,
    summary: {
      averageRating: product.averageRating,
      ratingCount: product.ratingCount,
    },
    pagination: createPaginationMeta(page, limit, total),
  });
}));

/**
 * POST /products/:id/ratings - Add or update a rating
 */
router.post('/products/:id/ratings', authenticate, asyncHandler(async (req, res) => {
  const { rating, review } = req.body;
  const productId = parseInt(req.params.id, 10);

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    throw new ValidationError(ERROR_MESSAGES.INVALID_RATING);
  }

  const product = await Product.findOne({ id: productId });
  if (!product) {
    throw new NotFoundError('Product');
  }

  // Check if user already rated this product
  let existingRating = await Rating.findOne({ userId: req.userId, productId });

  if (existingRating) {
    // Update existing rating
    const oldRating = existingRating.rating;
    existingRating.rating = rating;
    existingRating.review = review || existingRating.review;
    await existingRating.save();

    // Recalculate average rating
    const newAverage = (product.averageRating * product.ratingCount - oldRating + rating) / product.ratingCount;
    product.averageRating = Math.round(newAverage * 10) / 10;
    await product.save();

    return sendSuccess(res, 200, existingRating, SUCCESS_MESSAGES.RATING_UPDATED);
  } else {
    // Create new rating
    const newRating = await Rating.create({
      id: await getNextSequence('rating'),
      userId: req.userId,
      productId,
      rating,
      review: review || '',
    });

    // Update product average rating
    const newCount = product.ratingCount + 1;
    const newAverage = (product.averageRating * product.ratingCount + rating) / newCount;
    product.averageRating = Math.round(newAverage * 10) / 10;
    product.ratingCount = newCount;
    await product.save();

    return sendSuccess(res, 201, newRating, SUCCESS_MESSAGES.RATING_ADDED);
  }
}));

/**
 * GET /products/:id/my-rating - Get user's rating for a product
 */
router.get('/products/:id/my-rating', authenticate, asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  const rating = await Rating.findOne({ userId: req.userId, productId });
  return sendSuccess(res, 200, rating);
}));

/**
 * DELETE /products/:id/ratings - Delete a rating
 */
router.delete('/products/:id/ratings', authenticate, asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  const rating = await Rating.findOne({ userId: req.userId, productId });

  if (!rating) {
    throw new NotFoundError('Rating');
  }

  const product = await Product.findOne({ id: productId });
  if (product && product.ratingCount > 0) {
    const newCount = product.ratingCount - 1;
    if (newCount === 0) {
      product.averageRating = 0;
    } else {
      const newAverage = (product.averageRating * product.ratingCount - rating.rating) / newCount;
      product.averageRating = Math.round(newAverage * 10) / 10;
    }
    product.ratingCount = newCount;
    await product.save();
  }

  await Rating.deleteOne({ _id: rating._id });
  return sendSuccess(res, 200, null, SUCCESS_MESSAGES.RATING_DELETED);
}));

module.exports = router;

