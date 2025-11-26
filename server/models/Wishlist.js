/**
 * Wishlist Model
 */
const mongoose = require('mongoose');

const WishlistItemSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true, index: true },
    addedAt: { type: Date, default: Date.now },
    note: { type: String, maxlength: 500 },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    notifyOnSale: { type: Boolean, default: false },
    notifyWhenInStock: { type: Boolean, default: false },
  },
  { _id: false }
);

const WishlistSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true, unique: true, index: true },
    items: {
      type: [WishlistItemSchema],
      default: [],
      validate: [val => val.length <= 100, 'Maximum 100 items in wishlist'],
    },
    isPublic: { type: Boolean, default: false },
    shareToken: { type: String, unique: true, sparse: true },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
WishlistSchema.index({ 'items.productId': 1 });
WishlistSchema.index({ shareToken: 1 });

// Virtual for item count
WishlistSchema.virtual('itemCount').get(function() {
  return this.items?.length || 0;
});

// Instance method to add item
WishlistSchema.methods.addItem = async function(productId, options = {}) {
  // Check if already exists
  const exists = this.items.some(item => item.productId === productId);
  if (exists) {
    throw new Error('Product already in wishlist');
  }
  
  this.items.push({
    productId,
    note: options.note,
    priority: options.priority,
    notifyOnSale: options.notifyOnSale,
    notifyWhenInStock: options.notifyWhenInStock,
  });
  
  await this.save();
  return this;
};

// Instance method to remove item
WishlistSchema.methods.removeItem = async function(productId) {
  this.items = this.items.filter(item => item.productId !== productId);
  await this.save();
  return this;
};

// Instance method to check if product is in wishlist
WishlistSchema.methods.hasProduct = function(productId) {
  return this.items.some(item => item.productId === productId);
};

// Instance method to generate share token
WishlistSchema.methods.generateShareToken = async function() {
  this.shareToken = require('crypto').randomBytes(16).toString('hex');
  this.isPublic = true;
  await this.save();
  return this.shareToken;
};

// Static method to get by share token
WishlistSchema.statics.getByShareToken = async function(token) {
  return this.findOne({ shareToken: token, isPublic: true });
};

module.exports = mongoose.model('Wishlist', WishlistSchema);


