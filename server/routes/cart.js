/**
 * Cart Routes
 */
const express = require('express');
const router = express.Router();

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { sendSuccess } = require('../utils/response');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const { validateRequired } = require('../middleware/validate');

/**
 * Get enriched cart with product details
 */
async function getEnrichedCart(userId) {
  const cart = await Cart.findOne({ userId });
  
  if (!cart || cart.items.length === 0) {
    return { items: [], total: 0, itemCount: 0 };
  }

  const productIds = cart.items.map(item => item.productId);
  const products = await Product.find({ id: { $in: productIds } });
  const productMap = products.reduce((map, doc) => {
    map[doc.id] = doc;
    return map;
  }, {});

  let total = 0;
  const cartWithDetails = cart.items
    .map(item => {
      const product = productMap[item.productId];
      if (!product) return null;
      
      const subtotal = product.price * item.quantity;
      total += subtotal;
      
      return {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal,
        image: product.image,
      };
    })
    .filter(Boolean);

  return {
    items: cartWithDetails,
    total,
    itemCount: cartWithDetails.reduce((sum, item) => sum + item.quantity, 0),
  };
}

/**
 * GET /cart - Get user's cart
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const cart = await getEnrichedCart(req.userId);
  return sendSuccess(res, 200, cart);
}));

/**
 * POST /cart/items - Add item to cart
 */
router.post('/items',
  authenticate,
  validateRequired(['productId', 'quantity']),
  asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;
    const parsedProductId = parseInt(productId, 10);
    
    // Validate product exists and has stock
    const product = await Product.findOne({ id: parsedProductId });
    if (!product) {
      throw new NotFoundError('Product');
    }
    if (product.stock < quantity) {
      throw new ValidationError(ERROR_MESSAGES.INSUFFICIENT_STOCK);
    }

    // Try to update existing cart item
    let cart = await Cart.findOneAndUpdate(
      { userId: req.userId, 'items.productId': parsedProductId },
      { $inc: { 'items.$.quantity': quantity } },
      { new: true }
    );

    // If item doesn't exist in cart, add it
    if (!cart) {
      cart = await Cart.findOneAndUpdate(
        { userId: req.userId },
        { $push: { items: { productId: parsedProductId, quantity } } },
        { new: true, upsert: true }
      );
    }

    return sendSuccess(res, 201, cart.items, SUCCESS_MESSAGES.ITEM_ADDED);
  })
);

/**
 * PUT /cart/items/:productId - Update cart item quantity
 */
router.put('/items/:productId', authenticate, asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const productId = parseInt(req.params.productId, 10);
  
  if (!quantity || quantity <= 0) {
    throw new ValidationError('Quantity must be a positive number');
  }

  // Validate product has enough stock
  const product = await Product.findOne({ id: productId });
  if (!product || product.stock < quantity) {
    throw new ValidationError(ERROR_MESSAGES.INSUFFICIENT_STOCK);
  }

  const cart = await Cart.findOneAndUpdate(
    { userId: req.userId, 'items.productId': productId },
    { $set: { 'items.$.quantity': quantity } },
    { new: true }
  );

  if (!cart) {
    throw new NotFoundError('Item not found in cart');
  }

  return sendSuccess(res, 200, cart.items, SUCCESS_MESSAGES.CART_UPDATED);
}));

/**
 * DELETE /cart/items/:productId - Remove item from cart
 */
router.delete('/items/:productId', authenticate, asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  
  const cart = await Cart.findOneAndUpdate(
    { userId: req.userId },
    { $pull: { items: { productId } } },
    { new: true }
  );

  if (!cart) {
    throw new NotFoundError('Cart');
  }

  return sendSuccess(res, 200, cart.items, SUCCESS_MESSAGES.ITEM_REMOVED);
}));

/**
 * DELETE /cart - Clear cart
 */
router.delete('/', authenticate, asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate(
    { userId: req.userId },
    { $set: { items: [] } },
    { upsert: true }
  );
  
  return sendSuccess(res, 200, null, SUCCESS_MESSAGES.CART_CLEARED);
}));

module.exports = router;

