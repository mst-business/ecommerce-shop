/**
 * Product Model
 */
const mongoose = require('mongoose');

// Product variant schema (for size, color, etc.)
const VariantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "Size", "Color"
    value: { type: String, required: true }, // e.g., "Large", "Red"
    sku: { type: String }, // Stock Keeping Unit
    priceModifier: { type: Number, default: 0 }, // Price adjustment (+/- from base price)
    stock: { type: Number, default: 0, min: 0 },
    image: { type: String }, // Variant-specific image
  },
  { _id: true }
);

// Product image schema
const ProductImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    alt: { type: String },
    isPrimary: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

// Inventory history schema
const InventoryLogSchema = new mongoose.Schema(
  {
    type: { 
      type: String, 
      enum: ['restock', 'sale', 'return', 'adjustment', 'damage'],
      required: true,
    },
    quantity: { type: Number, required: true }, // Positive for additions, negative for removals
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reason: { type: String },
    orderId: { type: Number }, // Reference to order if applicable
    performedBy: { type: Number }, // User ID who made the change
    performedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    // Core fields
    id: { type: Number, unique: true, index: true },
    sku: { type: String, unique: true, sparse: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    
    // Pricing
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 }, // Original price for showing discounts
    costPrice: { type: Number, min: 0 }, // Cost to business (for profit calculation)
    
    // Description
    description: { type: String, maxlength: 5000 },
    shortDescription: { type: String, maxlength: 500 },
    
    // Categorization
    categoryId: { type: Number, required: true, index: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    brand: { type: String, trim: true },
    
    // Images
    image: { type: String }, // Primary image (backwards compatible)
    images: {
      type: [ProductImageSchema],
      default: [],
      validate: [val => val.length <= 20, 'Maximum 20 images allowed'],
    },
    
    // Inventory
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    trackInventory: { type: Boolean, default: true },
    allowBackorder: { type: Boolean, default: false },
    inventoryHistory: {
      type: [InventoryLogSchema],
      default: [],
      select: false, // Don't return by default
    },
    
    // Variants
    hasVariants: { type: Boolean, default: false },
    variants: {
      type: [VariantSchema],
      default: [],
    },
    
    // Physical properties (for shipping)
    weight: { type: Number, min: 0 }, // in kg
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
    },
    
    // Ratings
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    
    // Status
    active: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false, index: true },
    isNew: { type: Boolean, default: true },
    
    // SEO
    metaTitle: { type: String, maxlength: 70 },
    metaDescription: { type: String, maxlength: 160 },
    
    // Soft delete
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    
    // Stats
    viewCount: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for common queries
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ averageRating: -1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ salesCount: -1 });
ProductSchema.index({ categoryId: 1, active: 1, isDeleted: 1 });
ProductSchema.index({ featured: 1, active: 1 });
ProductSchema.index({ tags: 1 });

// Virtual for primary image
ProductSchema.virtual('primaryImage').get(function() {
  if (this.images && this.images.length > 0) {
    const primary = this.images.find(img => img.isPrimary);
    return primary ? primary.url : this.images[0].url;
  }
  return this.image;
});

// Virtual for discount percentage
ProductSchema.virtual('discountPercentage').get(function() {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return Math.round((1 - this.price / this.compareAtPrice) * 100);
  }
  return 0;
});

// Virtual for profit margin
ProductSchema.virtual('profitMargin').get(function() {
  if (this.costPrice && this.price > 0) {
    return Math.round((1 - this.costPrice / this.price) * 100);
  }
  return null;
});

// Virtual for in stock status
ProductSchema.virtual('inStock').get(function() {
  if (!this.trackInventory) return true;
  if (this.hasVariants) {
    return this.variants.some(v => v.stock > 0);
  }
  return this.stock > 0 || this.allowBackorder;
});

// Virtual for low stock warning
ProductSchema.virtual('isLowStock').get(function() {
  if (!this.trackInventory) return false;
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

// Don't return deleted products by default
ProductSchema.pre(/^find/, function(next) {
  if (!this.getQuery().isDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// Generate slug before saving
ProductSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Instance method to update stock
ProductSchema.methods.updateStock = async function(quantity, type, reason, orderId, userId) {
  const previousStock = this.stock;
  const newStock = Math.max(0, previousStock + quantity);
  
  this.stock = newStock;
  
  // Add to inventory history
  if (!this.inventoryHistory) this.inventoryHistory = [];
  this.inventoryHistory.push({
    type,
    quantity,
    previousStock,
    newStock,
    reason,
    orderId,
    performedBy: userId,
  });
  
  // Keep only last 100 entries
  if (this.inventoryHistory.length > 100) {
    this.inventoryHistory = this.inventoryHistory.slice(-100);
  }
  
  await this.save();
  return this;
};

// Instance method to increment view count
ProductSchema.methods.incrementViews = async function() {
  this.viewCount += 1;
  await this.save();
};

module.exports = mongoose.model('Product', ProductSchema);
