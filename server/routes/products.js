/**
 * Product Routes
 */
const express = require('express');
const router = express.Router();

const Product = require('../models/Product');
const Category = require('../models/Category');
const { getNextSequence } = require('../utils/getNextSequence');
const { sendSuccess, sendError } = require('../utils/response');
const { parsePagination, createPaginationMeta } = require('../utils/pagination');
const { SORT_OPTIONS, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { validateRequired, validatePositiveNumber } = require('../middleware/validate');

/**
 * Build sort order from query parameter
 */
function getSortOrder(sortBy) {
  switch (sortBy) {
    case 'rating':
      return SORT_OPTIONS.RATING;
    case 'price_asc':
      return SORT_OPTIONS.PRICE_ASC;
    case 'price_desc':
      return SORT_OPTIONS.PRICE_DESC;
    default:
      return SORT_OPTIONS.NEWEST;
  }
}

/**
 * GET /products - Get all products with filtering and pagination
 */
router.get('/', asyncHandler(async (req, res) => {
  const { categoryId, minPrice, maxPrice, search, includeOutOfStock, minRating, sortBy } = req.query;
  const { page, limit, skip } = parsePagination(req.query);
  
  // Build filter
  const filter = {
    active: { $ne: false },
  };

  // Only show in-stock products by default for customers
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

  const sortOrder = getSortOrder(sortBy);

  const [products, total] = await Promise.all([
    Product.find(filter).skip(skip).limit(limit).sort(sortOrder),
    Product.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, {
    products,
    pagination: createPaginationMeta(page, limit, total),
  });
}));

/**
 * GET /products/:id - Get a single product
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await Product.findOne({ id: parseInt(req.params.id, 10) });
  
  if (!product) {
    throw new NotFoundError('Product');
  }
  
  return sendSuccess(res, 200, product);
}));

/**
 * POST /products - Create a new product
 */
router.post('/',
  validateRequired(['name', 'price', 'categoryId']),
  asyncHandler(async (req, res) => {
    const { name, price, description, categoryId, stock, image, active } = req.body;
    
    // Validate category exists
    const category = await Category.findOne({ id: parseInt(categoryId, 10) });
    if (!category) {
      throw new ValidationError(ERROR_MESSAGES.INVALID_CATEGORY);
    }
    
    // Validate price
    if (isNaN(price) || Number(price) <= 0) {
      throw new ValidationError('Price must be a positive number');
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

    return sendSuccess(res, 201, newProduct, SUCCESS_MESSAGES.PRODUCT_CREATED);
  })
);

/**
 * PUT /products/:id - Update a product
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { name, price, description, categoryId, stock, image, active } = req.body;

  // Validate category if provided
  if (categoryId) {
    const category = await Category.findOne({ id: parseInt(categoryId, 10) });
    if (!category) {
      throw new ValidationError(ERROR_MESSAGES.INVALID_CATEGORY);
    }
  }

  // Build update object
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
    throw new NotFoundError('Product');
  }

  return sendSuccess(res, 200, updatedProduct, SUCCESS_MESSAGES.PRODUCT_UPDATED);
}));

/**
 * DELETE /products/:id - Delete a product
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await Product.findOneAndDelete({ id: parseInt(req.params.id, 10) });
  
  if (!deleted) {
    throw new NotFoundError('Product');
  }
  
  return sendSuccess(res, 200, null, SUCCESS_MESSAGES.PRODUCT_DELETED);
}));

module.exports = router;

