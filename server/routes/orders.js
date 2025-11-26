/**
 * Order Routes
 */
const express = require('express');
const router = express.Router();

const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { getNextSequence } = require('../utils/getNextSequence');
const { sendSuccess } = require('../utils/response');
const { ORDER_STATUSES, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');
const { asyncHandler, NotFoundError, ValidationError, ForbiddenError } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const { validateRequired, validateNonEmptyArray, validateEmail, validateEnum } = require('../middleware/validate');

/**
 * Process order items - validate stock and calculate totals
 */
async function processOrderItems(items) {
  const orderItems = [];
  let total = 0;

  for (const item of items) {
    if (!item.productId || !item.quantity) {
      throw new ValidationError('Each item must have productId and quantity');
    }

    const product = await Product.findOne({ id: parseInt(item.productId, 10) });
    if (!product) {
      throw new ValidationError(`Product ${item.productId} not found`);
    }
    if (product.stock < item.quantity) {
      throw new ValidationError(`Insufficient stock for product ${product.name}`);
    }

    const itemTotal = product.price * item.quantity;
    total += itemTotal;

    orderItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      price: product.price,
      subtotal: itemTotal,
    });

    // Reduce stock
    product.stock -= item.quantity;
    await product.save();
  }

  return { orderItems, total };
}

/**
 * GET /orders - Get user's orders
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
  return sendSuccess(res, 200, orders);
}));

/**
 * GET /orders/:id - Get a single order
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const order = await Order.findOne({ id: parseInt(req.params.id, 10) });
  
  if (!order) {
    throw new NotFoundError('Order');
  }
  
  // Check if user owns this order
  if (order.userId !== req.userId) {
    throw new ForbiddenError(ERROR_MESSAGES.ACCESS_DENIED);
  }
  
  return sendSuccess(res, 200, order);
}));

/**
 * POST /orders - Create a new order
 */
router.post('/',
  authenticate,
  validateRequired(['items']),
  asyncHandler(async (req, res) => {
    const { items, shippingAddress, paymentMethod } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError(ERROR_MESSAGES.INVALID_ORDER_ITEMS);
    }

    const { orderItems, total } = await processOrderItems(items);

    // Clear cart after order
    await Cart.findOneAndUpdate({ userId: req.userId }, { $set: { items: [] } });

    const newOrder = await Order.create({
      id: await getNextSequence('order'),
      userId: req.userId,
      items: orderItems,
      total,
      status: 'pending',
      shippingAddress: shippingAddress || {},
      paymentMethod: paymentMethod || 'credit_card',
    });

    return sendSuccess(res, 201, newOrder, SUCCESS_MESSAGES.ORDER_CREATED);
  })
);

/**
 * PUT /orders/:id/status - Update order status (for admins)
 */
router.put('/:id/status',
  authenticate,
  validateEnum('status', ORDER_STATUSES, 'Status'),
  asyncHandler(async (req, res) => {
    const { status } = req.body;

    const order = await Order.findOneAndUpdate(
      { id: parseInt(req.params.id, 10) },
      { $set: { status } },
      { new: true }
    );

    if (!order) {
      throw new NotFoundError('Order');
    }

    return sendSuccess(res, 200, order, SUCCESS_MESSAGES.ORDER_STATUS_UPDATED);
  })
);

/**
 * POST /orders/guest - Create a guest order
 */
router.post('/guest',
  validateRequired(['items', 'shippingAddress', 'guestEmail']),
  asyncHandler(async (req, res) => {
    const { items, shippingAddress, guestEmail, guestPhone, paymentMethod } = req.body;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      throw new ValidationError('Invalid email format');
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError(ERROR_MESSAGES.INVALID_ORDER_ITEMS);
    }

    // Validate shipping address
    const requiredAddressFields = ['fullName', 'address', 'city', 'state', 'zipCode', 'country'];
    const missingAddressFields = requiredAddressFields.filter(field => !shippingAddress[field]);
    if (missingAddressFields.length > 0) {
      throw new ValidationError(`Missing shipping address fields: ${missingAddressFields.join(', ')}`);
    }

    const { orderItems, total } = await processOrderItems(items);

    const newOrder = await Order.create({
      id: await getNextSequence('order'),
      userId: null,
      guestEmail,
      guestPhone: guestPhone || '',
      isGuest: true,
      items: orderItems,
      total,
      status: 'pending',
      shippingAddress,
      paymentMethod: paymentMethod || 'credit_card',
    });

    return sendSuccess(res, 201, newOrder, 'Order placed successfully! Check your email for confirmation.');
  })
);

/**
 * GET /orders/guest/:id - Get guest order by ID and email
 */
router.get('/guest/:id', asyncHandler(async (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    throw new ValidationError('Email is required to view guest order');
  }

  const order = await Order.findOne({ 
    id: parseInt(req.params.id, 10),
    guestEmail: email,
    isGuest: true,
  });

  if (!order) {
    throw new NotFoundError('Order not found or email does not match');
  }

  return sendSuccess(res, 200, order);
}));

module.exports = router;


