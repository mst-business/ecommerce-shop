const express = require('express');
const bcrypt = require('bcrypt');

const Product = require('../models/Product');
const Category = require('../models/Category');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const User = require('../models/User');
const Rating = require('../models/Rating');
const { getNextSequence } = require('../utils/getNextSequence');

const router = express.Router();

function sendResponse(res, statusCode, data = null, message = null, error = null) {
  const response = {};
  if (data !== null) response.data = data;
  if (message) response.message = message;
  if (error) response.error = error;
  return res.status(statusCode).json(response);
}

function validateRequired(data, requiredFields) {
  const missing = requiredFields.filter((field) => !data[field]);
  if (missing.length > 0) {
    return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
  }
  return { valid: true };
}

function authenticate(req, res, next) {
  const userId = req.headers['x-user-id'] || req.body.userId;
  if (!userId) {
    return sendResponse(res, 401, null, null, 'Authentication required');
  }
  req.userId = parseInt(userId, 10);
  next();
}

// Admin authentication middleware - checks if user is authenticated AND has admin role
async function authenticateAdmin(req, res, next) {
  const userId = req.headers['x-user-id'] || req.body.userId;
  if (!userId) {
    return sendResponse(res, 401, null, null, 'Authentication required');
  }
  
  try {
    const user = await User.findOne({ id: parseInt(userId, 10) });
    if (!user) {
      return sendResponse(res, 401, null, null, 'User not found');
    }
    if (user.role !== 'admin') {
      return sendResponse(res, 403, null, null, 'Admin access required');
    }
    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
}

// ============================
// Products
// ============================
router.get('/products', async (req, res) => {
  try {
    const { categoryId, minPrice, maxPrice, search, includeOutOfStock, minRating, sortBy } = req.query;
    const filter = {};

    // By default, only show active products with stock > 0 for customers
    filter.active = { $ne: false };
    if (includeOutOfStock !== 'true') {
      filter.stock = { $gt: 0 };
    }

    if (categoryId) {
      filter.categoryId = parseInt(categoryId, 10);
    }
    if (minPrice) {
      filter.price = { ...(filter.price || {}), $gte: parseFloat(minPrice) };
    }
    if (maxPrice) {
      filter.price = { ...(filter.price || {}), $lte: parseFloat(maxPrice) };
    }
    if (search) {
      filter.$text = { $search: search };
    }
    if (minRating) {
      filter.averageRating = { $gte: parseFloat(minRating) };
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Determine sort order
    let sortOrder = { createdAt: -1 };
    if (sortBy === 'rating') {
      sortOrder = { averageRating: -1, ratingCount: -1 };
    } else if (sortBy === 'price_asc') {
      sortOrder = { price: 1 };
    } else if (sortBy === 'price_desc') {
      sortOrder = { price: -1 };
    }

    const [products, total] = await Promise.all([
      Product.find(filter).skip(skip).limit(limit).sort(sortOrder),
      Product.countDocuments(filter),
    ]);

    return sendResponse(res, 200, {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: parseInt(req.params.id, 10) });
    if (!product) {
      return sendResponse(res, 404, null, null, 'Product not found');
    }
    return sendResponse(res, 200, product);
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

router.post('/products', async (req, res) => {
  const validation = validateRequired(req.body, ['name', 'price', 'categoryId']);
  if (!validation.valid) {
    return sendResponse(res, 400, null, null, validation.error);
  }

  try {
    const { name, price, description, categoryId, stock, image, active } = req.body;
    const category = await Category.findOne({ id: parseInt(categoryId, 10) });
    if (!category) {
      return sendResponse(res, 400, null, null, 'Invalid categoryId');
    }
    if (isNaN(price) || Number(price) <= 0) {
      return sendResponse(res, 400, null, null, 'Price must be a positive number');
    }

    const newProduct = await Product.create({
      id: await getNextSequence('product'),
      name,
      price: parseFloat(price),
      description: description || '',
      categoryId: parseInt(categoryId, 10),
      stock: stock !== undefined ? parseInt(stock, 10) : 0,
      image: image || '',
      active: active !== undefined ? active : true,
    });

    return sendResponse(res, 201, newProduct, 'Product created successfully');
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const { name, price, description, categoryId, stock, image, active } = req.body;

    if (categoryId) {
      const category = await Category.findOne({ id: parseInt(categoryId, 10) });
      if (!category) {
        return sendResponse(res, 400, null, null, 'Invalid categoryId');
      }
    }

    const update = {};
    if (name) update.name = name;
    if (price !== undefined) update.price = parseFloat(price);
    if (description !== undefined) update.description = description;
    if (categoryId) update.categoryId = parseInt(categoryId, 10);
    if (stock !== undefined) update.stock = parseInt(stock, 10);
    if (image !== undefined) update.image = image;
    if (active !== undefined) update.active = active;

    const updatedProduct = await Product.findOneAndUpdate(
      { id: parseInt(req.params.id, 10) },
      { $set: update },
      { new: true }
    );

    if (!updatedProduct) {
      return sendResponse(res, 404, null, null, 'Product not found');
    }

    return sendResponse(res, 200, updatedProduct, 'Product updated successfully');
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const deleted = await Product.findOneAndDelete({ id: parseInt(req.params.id, 10) });
    if (!deleted) {
      return sendResponse(res, 404, null, null, 'Product not found');
    }
    return sendResponse(res, 200, null, 'Product deleted successfully');
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

// ============================
// Ratings
// ============================

// Get ratings for a product
router.get('/products/:id/ratings', async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return sendResponse(res, 404, null, null, 'Product not found');
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
      Rating.find({ productId }).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Rating.countDocuments({ productId }),
    ]);

    // Enrich ratings with user info
    const userIds = [...new Set(ratings.map((r) => r.userId))];
    const users = await User.find({ id: { $in: userIds } }).select('id username firstName lastName');
    const userMap = users.reduce((map, user) => {
      map[user.id] = {
        username: user.username,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username,
      };
      return map;
    }, {});

    const enrichedRatings = ratings.map((rating) => ({
      ...rating.toObject(),
      user: userMap[rating.userId] || { username: 'Anonymous', name: 'Anonymous' },
    }));

    return sendResponse(res, 200, {
      ratings: enrichedRatings,
      summary: {
        averageRating: product.averageRating,
        ratingCount: product.ratingCount,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

// Add or update a rating for a product
router.post('/products/:id/ratings', authenticate, async (req, res) => {
  const { rating, review } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return sendResponse(res, 400, null, null, 'Rating must be between 1 and 5');
  }

  try {
    const productId = parseInt(req.params.id, 10);
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return sendResponse(res, 404, null, null, 'Product not found');
    }

    // Check if user has purchased this product (optional - can be removed if you want anyone to rate)
    const hasOrdered = await Order.exists({
      userId: req.userId,
      'items.productId': productId,
      status: { $in: ['delivered', 'shipped', 'processing'] },
    });

    // Check if user already rated this product
    let existingRating = await Rating.findOne({ userId: req.userId, productId });

    if (existingRating) {
      // Update existing rating
      const oldRating = existingRating.rating;
      existingRating.rating = rating;
      existingRating.review = review || existingRating.review;
      await existingRating.save();

      // Recalculate average rating
      const newAverage =
        (product.averageRating * product.ratingCount - oldRating + rating) / product.ratingCount;
      product.averageRating = Math.round(newAverage * 10) / 10;
      await product.save();

      return sendResponse(res, 200, existingRating, 'Rating updated successfully');
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

      return sendResponse(res, 201, newRating, 'Rating added successfully');
    }
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

// Get user's rating for a product
router.get('/products/:id/my-rating', authenticate, async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const rating = await Rating.findOne({ userId: req.userId, productId });
    return sendResponse(res, 200, rating);
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

// Delete a rating
router.delete('/products/:id/ratings', authenticate, async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const rating = await Rating.findOne({ userId: req.userId, productId });

    if (!rating) {
      return sendResponse(res, 404, null, null, 'Rating not found');
    }

    const product = await Product.findOne({ id: productId });
    if (product && product.ratingCount > 0) {
      const newCount = product.ratingCount - 1;
      if (newCount === 0) {
        product.averageRating = 0;
      } else {
        const newAverage =
          (product.averageRating * product.ratingCount - rating.rating) / newCount;
        product.averageRating = Math.round(newAverage * 10) / 10;
      }
      product.ratingCount = newCount;
      await product.save();
    }

    await Rating.deleteOne({ _id: rating._id });
    return sendResponse(res, 200, null, 'Rating deleted successfully');
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

// ============================
// Categories
// ============================
router.get('/categories', async (req, res) => {
  try {
    const allCategories = await Category.find().sort({ name: 1 });
    return sendResponse(res, 200, allCategories);
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

router.get('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findOne({ id: parseInt(req.params.id, 10) });
    if (!category) {
      return sendResponse(res, 404, null, null, 'Category not found');
    }
    const categoryProducts = await Product.find({ categoryId: category.id });
    return sendResponse(res, 200, { ...category.toObject(), products: categoryProducts });
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

router.post('/categories', async (req, res) => {
  const validation = validateRequired(req.body, ['name']);
  if (!validation.valid) {
    return sendResponse(res, 400, null, null, validation.error);
  }

  try {
    const { name, description } = req.body;
    const newCategory = await Category.create({
      id: await getNextSequence('category'),
      name,
      description: description || '',
    });
    return sendResponse(res, 201, newCategory, 'Category created successfully');
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const update = {};
    if (name) update.name = name;
    if (description !== undefined) update.description = description;

    const category = await Category.findOneAndUpdate(
      { id: parseInt(req.params.id, 10) },
      { $set: update },
      { new: true }
    );

    if (!category) {
      return sendResponse(res, 404, null, null, 'Category not found');
    }

    return sendResponse(res, 200, category, 'Category updated successfully');
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const hasProducts = await Product.exists({ categoryId: parseInt(req.params.id, 10) });
    if (hasProducts) {
      return sendResponse(res, 400, null, null, 'Cannot delete category with existing products');
    }

    const deleted = await Category.findOneAndDelete({ id: parseInt(req.params.id, 10) });
    if (!deleted) {
      return sendResponse(res, 404, null, null, 'Category not found');
    }

    return sendResponse(res, 200, null, 'Category deleted successfully');
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

// ============================
// Cart
// ============================
router.get('/cart', authenticate, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart || cart.items.length === 0) {
      return sendResponse(res, 200, { items: [], total: 0, itemCount: 0 });
    }

    const productIds = cart.items.map((item) => item.productId);
    const productMap = await Product.find({ id: { $in: productIds } }).then((docs) =>
      docs.reduce((map, doc) => {
        map[doc.id] = doc;
        return map;
      }, {})
    );

    let total = 0;
    const cartWithDetails = cart.items
      .map((item) => {
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

    return sendResponse(res, 200, {
      items: cartWithDetails,
      total,
      itemCount: cartWithDetails.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

router.post('/cart/items', authenticate, async (req, res) => {
  const validation = validateRequired(req.body, ['productId', 'quantity']);
  if (!validation.valid) {
    return sendResponse(res, 400, null, null, validation.error);
  }

  try {
    const { productId, quantity } = req.body;
    const product = await Product.findOne({ id: parseInt(productId, 10) });
    if (!product) {
      return sendResponse(res, 404, null, null, 'Product not found');
    }
    if (product.stock < quantity) {
      return sendResponse(res, 400, null, null, 'Insufficient stock');
    }

    const cart = await Cart.findOneAndUpdate(
      { userId: req.userId, 'items.productId': parseInt(productId, 10) },
      { $inc: { 'items.$.quantity': quantity } },
      { new: true }
    );

    if (!cart) {
      const updatedCart = await Cart.findOneAndUpdate(
        { userId: req.userId },
        { $push: { items: { productId: parseInt(productId, 10), quantity } } },
        { new: true, upsert: true }
      );
      return sendResponse(res, 201, updatedCart.items, 'Item added to cart');
    }

    return sendResponse(res, 201, cart.items, 'Item added to cart');
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

router.put('/cart/items/:productId', authenticate, async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity <= 0) {
    return sendResponse(res, 400, null, null, 'Quantity must be a positive number');
  }

  try {
    const product = await Product.findOne({ id: parseInt(req.params.productId, 10) });
    if (!product || product.stock < quantity) {
      return sendResponse(res, 400, null, null, 'Insufficient stock');
    }

    const cart = await Cart.findOneAndUpdate(
      { userId: req.userId, 'items.productId': parseInt(req.params.productId, 10) },
      { $set: { 'items.$.quantity': quantity } },
      { new: true }
    );

    if (!cart) {
      return sendResponse(res, 404, null, null, 'Item not found in cart');
    }

    return sendResponse(res, 200, cart.items, 'Cart item updated');
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

router.delete('/cart/items/:productId', authenticate, async (req, res) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { userId: req.userId },
      { $pull: { items: { productId: parseInt(req.params.productId, 10) } } },
      { new: true }
    );

    if (!cart) {
      return sendResponse(res, 404, null, null, 'Cart not found');
    }

    return sendResponse(res, 200, cart.items, 'Item removed from cart');
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

router.delete('/cart', authenticate, async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ userId: req.userId }, { $set: { items: [] } }, { upsert: true });
    return sendResponse(res, 200, null, 'Cart cleared');
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

// ============================
// Orders
// ============================
router.get('/orders', authenticate, async (req, res) => {
  try {
    const userOrders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
    return sendResponse(res, 200, userOrders);
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

router.get('/orders/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({ id: parseInt(req.params.id, 10) });
    if (!order) {
      return sendResponse(res, 404, null, null, 'Order not found');
    }
    if (order.userId !== req.userId) {
      return sendResponse(res, 403, null, null, 'Access denied');
    }
    return sendResponse(res, 200, order);
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

router.post('/orders', authenticate, async (req, res) => {
  const validation = validateRequired(req.body, ['items']);
  if (!validation.valid) {
    return sendResponse(res, 400, null, null, validation.error);
  }

  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return sendResponse(res, 400, null, null, 'Items must be a non-empty array');
    }

    const orderItems = [];
    let total = 0;

    for (const item of items) {
      if (!item.productId || !item.quantity) {
        return sendResponse(res, 400, null, null, 'Each item must have productId and quantity');
      }

      const product = await Product.findOne({ id: parseInt(item.productId, 10) });
      if (!product) {
        return sendResponse(res, 400, null, null, `Product ${item.productId} not found`);
      }
      if (product.stock < item.quantity) {
        return sendResponse(res, 400, null, null, `Insufficient stock for product ${product.name}`);
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

      product.stock -= item.quantity;
      await product.save();
    }

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

    return sendResponse(res, 201, newOrder, 'Order created successfully');
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

router.put('/orders/:id/status', authenticate, async (req, res) => {
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const { status } = req.body;

  if (!status || !validStatuses.includes(status)) {
    return sendResponse(res, 400, null, null, `Status must be one of: ${validStatuses.join(', ')}`);
  }

  try {
    const order = await Order.findOneAndUpdate(
      { id: parseInt(req.params.id, 10) },
      { $set: { status } },
      { new: true }
    );

    if (!order) {
      return sendResponse(res, 404, null, null, 'Order not found');
    }

    return sendResponse(res, 200, order, 'Order status updated successfully');
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

// ============================
// Users
// ============================
router.post('/users/register', async (req, res) => {
  const validation = validateRequired(req.body, ['username', 'password', 'email']);
  if (!validation.valid) {
    return sendResponse(res, 400, null, null, validation.error);
  }

  try {
    const { username, password, email, firstName, lastName } = req.body;
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      return sendResponse(res, 409, null, null, 'Username or email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      id: await getNextSequence('user'),
      username,
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
    });

    const { password: _, ...userResponse } = newUser.toObject();
    return sendResponse(res, 201, userResponse, 'User registered successfully');
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

router.post('/users/login', async (req, res) => {
  const validation = validateRequired(req.body, ['username', 'password']);
  if (!validation.valid) {
    return sendResponse(res, 400, null, null, validation.error);
  }

  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return sendResponse(res, 401, null, null, 'Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return sendResponse(res, 401, null, null, 'Invalid credentials');
    }

    const { password: _, ...userResponse } = user.toObject();
    return sendResponse(
      res,
      200,
      {
        user: userResponse,
        token: `mock-token-${user.id}`,
      },
      'Login successful'
    );
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

router.get('/users/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.userId });
    if (!user) {
      return sendResponse(res, 404, null, null, 'User not found');
    }
    const { password: _, ...userResponse } = user.toObject();
    return sendResponse(res, 200, userResponse);
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

router.put('/users/profile', authenticate, async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    if (email) {
      const emailInUse = await User.findOne({ email, id: { $ne: req.userId } });
      if (emailInUse) {
        return sendResponse(res, 409, null, null, 'Email already in use');
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { id: req.userId },
      {
        $set: {
          ...(email && { email }),
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return sendResponse(res, 404, null, null, 'User not found');
    }

    const { password: _, ...userResponse } = updatedUser.toObject();
    return sendResponse(res, 200, userResponse, 'Profile updated successfully');
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

// ============================
// Admin Endpoints (Protected by admin role)
// ============================

// Admin: Get dashboard statistics
router.get('/admin/stats', authenticateAdmin, async (req, res) => {
  try {
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

    return sendResponse(res, 200, {
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
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

// Admin: Get all orders (for admin view)
router.get('/admin/orders', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Order.countDocuments(filter),
    ]);

    // Enrich orders with user information
    const userIds = [...new Set(orders.map((o) => o.userId))];
    const users = await User.find({ id: { $in: userIds } });
    const userMap = users.reduce((map, user) => {
      map[user.id] = { username: user.username, email: user.email };
      return map;
    }, {});

    const enrichedOrders = orders.map((order) => ({
      ...order.toObject(),
      user: userMap[order.userId] || { username: 'Unknown', email: '' },
    }));

    return sendResponse(res, 200, {
      orders: enrichedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

// Admin: Get recent orders
router.get('/admin/orders/recent', authenticateAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const orders = await Order.find().sort({ createdAt: -1 }).limit(limit);

    // Enrich with user info
    const userIds = [...new Set(orders.map((o) => o.userId))];
    const users = await User.find({ id: { $in: userIds } });
    const userMap = users.reduce((map, user) => {
      map[user.id] = { username: user.username, email: user.email };
      return map;
    }, {});

    const enrichedOrders = orders.map((order) => ({
      ...order.toObject(),
      user: userMap[order.userId] || { username: 'Unknown', email: '' },
    }));

    return sendResponse(res, 200, enrichedOrders);
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

// Admin: Get all customers
router.get('/admin/customers', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
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
    const userIds = users.map((u) => u.id);
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

    const enrichedUsers = users.map((user) => ({
      ...user.toObject(),
      orderCount: orderMap[user.id]?.orderCount || 0,
      totalSpent: orderMap[user.id]?.totalSpent || 0,
    }));

    return sendResponse(res, 200, {
      customers: enrichedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

// Admin: Get single customer with order history
router.get('/admin/customers/:id', authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findOne({ id: parseInt(req.params.id, 10) }).select('-password');
    if (!user) {
      return sendResponse(res, 404, null, null, 'Customer not found');
    }

    const orders = await Order.find({ userId: user.id }).sort({ createdAt: -1 });
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

    return sendResponse(res, 200, {
      ...user.toObject(),
      orders,
      orderCount: orders.length,
      totalSpent,
    });
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

// Admin: Bulk update products (activate/deactivate)
router.put('/admin/products/bulk', authenticateAdmin, async (req, res) => {
  try {
    const { productIds, action } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return sendResponse(res, 400, null, null, 'productIds must be a non-empty array');
    }

    if (!['activate', 'deactivate'].includes(action)) {
      return sendResponse(res, 400, null, null, 'action must be "activate" or "deactivate"');
    }

    const result = await Product.updateMany(
      { id: { $in: productIds.map((id) => parseInt(id, 10)) } },
      { $set: { active: action === 'activate' } }
    );

    return sendResponse(
      res,
      200,
      { modifiedCount: result.modifiedCount },
      `${result.modifiedCount} products ${action}d successfully`
    );
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

// Admin: Get all products including inactive (for admin management)
router.get('/admin/products', authenticateAdmin, async (req, res) => {
  try {
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

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);

    // Get category names
    const categoryIds = [...new Set(products.map((p) => p.categoryId))];
    const categories = await Category.find({ id: { $in: categoryIds } });
    const categoryMap = categories.reduce((map, cat) => {
      map[cat.id] = cat.name;
      return map;
    }, {});

    const enrichedProducts = products.map((product) => ({
      ...product.toObject(),
      categoryName: categoryMap[product.categoryId] || 'Unknown',
    }));

    return sendResponse(res, 200, {
      products: enrichedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

// Admin: Update product stock
router.put('/admin/products/:id/stock', authenticateAdmin, async (req, res) => {
  try {
    const { stock } = req.body;

    if (stock === undefined || stock < 0) {
      return sendResponse(res, 400, null, null, 'Stock must be a non-negative number');
    }

    const product = await Product.findOneAndUpdate(
      { id: parseInt(req.params.id, 10) },
      { $set: { stock: parseInt(stock, 10) } },
      { new: true }
    );

    if (!product) {
      return sendResponse(res, 404, null, null, 'Product not found');
    }

    return sendResponse(res, 200, product, 'Stock updated successfully');
  } catch (error) {
    return sendResponse(res, 500, null, null, error.message);
  }
});

// ============================
// Health check
// ============================
router.get('/health', (req, res) => {
  return sendResponse(res, 200, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;

