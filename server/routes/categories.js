/**
 * Category Routes
 */
const express = require('express');
const router = express.Router();

const Category = require('../models/Category');
const Product = require('../models/Product');
const { getNextSequence } = require('../utils/getNextSequence');
const { sendSuccess } = require('../utils/response');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { validateRequired } = require('../middleware/validate');

/**
 * GET /categories - Get all categories
 */
router.get('/', asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  return sendSuccess(res, 200, categories);
}));

/**
 * GET /categories/:id - Get a single category with its products
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const category = await Category.findOne({ id: parseInt(req.params.id, 10) });
  
  if (!category) {
    throw new NotFoundError('Category');
  }
  
  const products = await Product.find({ categoryId: category.id });
  
  return sendSuccess(res, 200, {
    ...category.toObject(),
    products,
  });
}));

/**
 * POST /categories - Create a new category
 */
router.post('/',
  validateRequired(['name']),
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    
    const newCategory = await Category.create({
      id: await getNextSequence('category'),
      name,
      description: description || '',
    });
    
    return sendSuccess(res, 201, newCategory, SUCCESS_MESSAGES.CATEGORY_CREATED);
  })
);

/**
 * PUT /categories/:id - Update a category
 */
router.put('/:id', asyncHandler(async (req, res) => {
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
    throw new NotFoundError('Category');
  }

  return sendSuccess(res, 200, category, SUCCESS_MESSAGES.CATEGORY_UPDATED);
}));

/**
 * DELETE /categories/:id - Delete a category
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const categoryId = parseInt(req.params.id, 10);
  
  // Check if category has products
  const hasProducts = await Product.exists({ categoryId });
  if (hasProducts) {
    throw new ValidationError(ERROR_MESSAGES.CATEGORY_HAS_PRODUCTS);
  }

  const deleted = await Category.findOneAndDelete({ id: categoryId });
  
  if (!deleted) {
    throw new NotFoundError('Category');
  }

  return sendSuccess(res, 200, null, SUCCESS_MESSAGES.CATEGORY_DELETED);
}));

module.exports = router;


