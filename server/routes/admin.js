/**
 * Admin Routes
 */
const express = require('express');
const router = express.Router();

const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const { sendSuccess } = require('../utils/response');
const { parsePagination, createPaginationMeta } = require('../utils/pagination');
const { SUCCESS_MESSAGES } = require('../utils/constants');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { authenticateAdmin } = require('../middleware/auth');

// Apply admin auth to all routes
router.use(authenticateAdmin);

/**
 * Enrich orders with user information
 */
async function enrichOrdersWithUsers(orders) {
  const userIds = [...new Set(orders.map(o => o.userId).filter(Boolean))];
  const users = await User.find({ id: { $in: userIds } });
  
  const userMap = users.reduce((map, user) => {
    map[user.id] = { username: user.username, email: user.email };
    return map;
  }, {});

  return orders.map(order => ({
    ...order.toObject(),
    user: order.userId ? userMap[order.userId] || { username: 'Unknown', email: '' } : { username: 'Guest', email: order.guestEmail || '' },
  }));
}

/**
 * GET /admin/stats - Get dashboard statistics
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const [
    totalProducts,
    activeProducts,
    outOfStockProducts,
    totalCategories,
    totalUsers,
    totalOrders,
    orders,
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ active: true, stock: { $gt: 0 } }),
    Product.countDocuments({ stock: 0 }),
    Category.countDocuments(),
    User.countDocuments(),
    Order.countDocuments(),
    Order.find().sort({ createdAt: -1 }),
  ]);

  // Calculate total sales
  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);

  // Get orders by status
  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  // Get sales by day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const salesByDay = await Order.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        totalSales: { $sum: '$total' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Get top selling products
  const topProducts = await Order.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        productName: { $first: '$items.productName' },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.subtotal' },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 5 },
  ]);

  return sendSuccess(res, 200, {
    products: {
      total: totalProducts,
      active: activeProducts,
      outOfStock: outOfStockProducts,
    },
    categories: totalCategories,
    users: totalUsers,
    orders: {
      total: totalOrders,
      byStatus: ordersByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    },
    sales: {
      total: totalSales,
      byDay: salesByDay,
    },
    topProducts,
  });
}));

/**
 * GET /admin/orders - Get all orders with pagination
 */
router.get('/orders', asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 20);
  const { status } = req.query;

  const filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Order.countDocuments(filter),
  ]);

  const enrichedOrders = await enrichOrdersWithUsers(orders);

  return sendSuccess(res, 200, {
    orders: enrichedOrders,
    pagination: createPaginationMeta(page, limit, total),
  });
}));

/**
 * GET /admin/orders/recent - Get recent orders
 */
router.get('/orders/recent', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const orders = await Order.find().sort({ createdAt: -1 }).limit(limit);
  const enrichedOrders = await enrichOrdersWithUsers(orders);
  return sendSuccess(res, 200, enrichedOrders);
}));

/**
 * GET /admin/customers - Get all customers with pagination
 */
router.get('/customers', asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 20);
  const { search } = req.query;

  let filter = {};
  if (search) {
    filter = {
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ],
    };
  }

  const [users, total] = await Promise.all([
    User.find(filter).select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  // Get order counts for each user
  const userIds = users.map(u => u.id);
  const orderCounts = await Order.aggregate([
    { $match: { userId: { $in: userIds } } },
    {
      $group: {
        _id: '$userId',
        orderCount: { $sum: 1 },
        totalSpent: { $sum: '$total' },
      },
    },
  ]);

  const orderMap = orderCounts.reduce((map, item) => {
    map[item._id] = { orderCount: item.orderCount, totalSpent: item.totalSpent };
    return map;
  }, {});

  const enrichedUsers = users.map(user => ({
    ...user.toObject(),
    orderCount: orderMap[user.id]?.orderCount || 0,
    totalSpent: orderMap[user.id]?.totalSpent || 0,
  }));

  return sendSuccess(res, 200, {
    customers: enrichedUsers,
    pagination: createPaginationMeta(page, limit, total),
  });
}));

/**
 * GET /admin/customers/:id - Get single customer with order history
 */
router.get('/customers/:id', asyncHandler(async (req, res) => {
  const user = await User.findOne({ id: parseInt(req.params.id, 10) }).select('-password');
  
  if (!user) {
    throw new NotFoundError('Customer');
  }

  const orders = await Order.find({ userId: user.id }).sort({ createdAt: -1 });
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

  return sendSuccess(res, 200, {
    ...user.toObject(),
    orders,
    orderCount: orders.length,
    totalSpent,
  });
}));

/**
 * GET /admin/products - Get all products (including inactive)
 */
router.get('/products', asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 20);
  const { categoryId, search, active, inStock } = req.query;
  
  const filter = {};

  if (categoryId) {
    filter.categoryId = parseInt(categoryId, 10);
  }
  if (search) {
    filter.$text = { $search: search };
  }
  if (active !== undefined) {
    filter.active = active === 'true';
  }
  if (inStock === 'true') {
    filter.stock = { $gt: 0 };
  } else if (inStock === 'false') {
    filter.stock = 0;
  }

  const [products, total] = await Promise.all([
    Product.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Product.countDocuments(filter),
  ]);

  // Get category names
  const categoryIds = [...new Set(products.map(p => p.categoryId))];
  const categories = await Category.find({ id: { $in: categoryIds } });
  const categoryMap = categories.reduce((map, cat) => {
    map[cat.id] = cat.name;
    return map;
  }, {});

  const enrichedProducts = products.map(product => ({
    ...product.toObject(),
    categoryName: categoryMap[product.categoryId] || 'Unknown',
  }));

  return sendSuccess(res, 200, {
    products: enrichedProducts,
    pagination: createPaginationMeta(page, limit, total),
  });
}));

/**
 * PUT /admin/products/bulk - Bulk activate/deactivate products
 */
router.put('/products/bulk', asyncHandler(async (req, res) => {
  const { productIds, action } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new ValidationError('productIds must be a non-empty array');
  }

  if (!['activate', 'deactivate'].includes(action)) {
    throw new ValidationError('action must be "activate" or "deactivate"');
  }

  const result = await Product.updateMany(
    { id: { $in: productIds.map(id => parseInt(id, 10)) } },
    { $set: { active: action === 'activate' } }
  );

  return sendSuccess(
    res,
    200,
    { modifiedCount: result.modifiedCount },
    `${result.modifiedCount} products ${action}d successfully`
  );
}));

/**
 * PUT /admin/products/:id/stock - Update product stock
 */
router.put('/products/:id/stock', asyncHandler(async (req, res) => {
  const { stock } = req.body;

  if (stock === undefined || stock < 0) {
    throw new ValidationError('Stock must be a non-negative number');
  }

  const product = await Product.findOneAndUpdate(
    { id: parseInt(req.params.id, 10) },
    { $set: { stock: parseInt(stock, 10) } },
    { new: true }
  );

  if (!product) {
    throw new NotFoundError('Product');
  }

  return sendSuccess(res, 200, product, SUCCESS_MESSAGES.STOCK_UPDATED);
}));

module.exports = router;

