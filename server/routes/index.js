/**
 * Main Router - Combines all route modules
 */
const express = require('express');
const router = express.Router();

// Import route modules
const productsRouter = require('./products');
const ratingsRouter = require('./ratings');
const categoriesRouter = require('./categories');
const cartRouter = require('./cart');
const ordersRouter = require('./orders');
const usersRouter = require('./users');
const adminRouter = require('./admin');

// Import utilities
const { sendSuccess } = require('../utils/response');

// ============================
// Mount Routes
// ============================

// Products (public)
router.use('/products', productsRouter);

// Ratings (mounted under products)
router.use('/', ratingsRouter);

// Categories (public)
router.use('/categories', categoriesRouter);

// Cart (authenticated)
router.use('/cart', cartRouter);

// Orders (authenticated + guest)
router.use('/orders', ordersRouter);

// Users (auth routes)
router.use('/users', usersRouter);

// Admin (admin only)
router.use('/admin', adminRouter);

// ============================
// Health check
// ============================
router.get('/health', (req, res) => {
  return sendSuccess(res, 200, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;
