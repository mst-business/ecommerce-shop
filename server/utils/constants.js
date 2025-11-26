/**
 * Server Constants
 */

// Order statuses
const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

const ORDER_STATUSES = Object.values(ORDER_STATUS);

// User roles
const USER_ROLE = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
};

const USER_ROLES = Object.values(USER_ROLE);

// Payment methods
const PAYMENT_METHOD = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  PAYPAL: 'paypal',
  BANK_TRANSFER: 'bank_transfer',
};

const PAYMENT_METHODS = Object.values(PAYMENT_METHOD);

// Sorting options
const SORT_OPTIONS = {
  NEWEST: { createdAt: -1 },
  OLDEST: { createdAt: 1 },
  PRICE_ASC: { price: 1 },
  PRICE_DESC: { price: -1 },
  RATING: { averageRating: -1, ratingCount: -1 },
  NAME_ASC: { name: 1 },
  NAME_DESC: { name: -1 },
};

// Error messages
const ERROR_MESSAGES = {
  // Auth
  AUTH_REQUIRED: 'Authentication required',
  INVALID_CREDENTIALS: 'Invalid credentials',
  ADMIN_REQUIRED: 'Admin access required',
  USER_NOT_FOUND: 'User not found',
  
  // Products
  PRODUCT_NOT_FOUND: 'Product not found',
  INSUFFICIENT_STOCK: 'Insufficient stock',
  INVALID_CATEGORY: 'Invalid categoryId',
  
  // Orders
  ORDER_NOT_FOUND: 'Order not found',
  EMPTY_CART: 'Cart is empty',
  INVALID_ORDER_ITEMS: 'Items must be a non-empty array',
  
  // Categories
  CATEGORY_NOT_FOUND: 'Category not found',
  CATEGORY_HAS_PRODUCTS: 'Cannot delete category with existing products',
  
  // Cart
  CART_NOT_FOUND: 'Cart not found',
  ITEM_NOT_IN_CART: 'Item not found in cart',
  
  // Ratings
  RATING_NOT_FOUND: 'Rating not found',
  INVALID_RATING: 'Rating must be between 1 and 5',
  
  // Generic
  ACCESS_DENIED: 'Access denied',
  INVALID_INPUT: 'Invalid input',
  SERVER_ERROR: 'Internal server error',
};

// Success messages
const SUCCESS_MESSAGES = {
  // Products
  PRODUCT_CREATED: 'Product created successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  PRODUCT_DELETED: 'Product deleted successfully',
  STOCK_UPDATED: 'Stock updated successfully',
  
  // Orders
  ORDER_CREATED: 'Order created successfully',
  ORDER_STATUS_UPDATED: 'Order status updated successfully',
  
  // Categories
  CATEGORY_CREATED: 'Category created successfully',
  CATEGORY_UPDATED: 'Category updated successfully',
  CATEGORY_DELETED: 'Category deleted successfully',
  
  // Cart
  ITEM_ADDED: 'Item added to cart',
  CART_UPDATED: 'Cart item updated',
  ITEM_REMOVED: 'Item removed from cart',
  CART_CLEARED: 'Cart cleared',
  
  // Users
  USER_REGISTERED: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  
  // Ratings
  RATING_ADDED: 'Rating added successfully',
  RATING_UPDATED: 'Rating updated successfully',
  RATING_DELETED: 'Rating deleted successfully',
};

module.exports = {
  ORDER_STATUS,
  ORDER_STATUSES,
  USER_ROLE,
  USER_ROLES,
  PAYMENT_METHOD,
  PAYMENT_METHODS,
  SORT_OPTIONS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};

