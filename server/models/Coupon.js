/**
 * Coupon/Discount Model
 */
const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema(
  {
    // Core fields
    id: { type: Number, unique: true, index: true },
    code: { 
      type: String, 
      required: true, 
      unique: true, 
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    description: { type: String, maxlength: 500 },
    
    // Discount type and value
    discountType: {
      type: String,
      enum: ['percentage', 'fixed', 'free_shipping', 'buy_x_get_y'],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, min: 0 }, // Cap for percentage discounts
    
    // Buy X Get Y settings
    buyQuantity: { type: Number, min: 1 },
    getQuantity: { type: Number, min: 1 },
    getProductId: { type: Number }, // Specific product for "get" part
    
    // Validity
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    
    // Usage limits
    usageLimit: { type: Number, min: 0 }, // Total uses allowed
    usageLimitPerUser: { type: Number, default: 1, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    
    // Minimum requirements
    minimumOrderAmount: { type: Number, default: 0, min: 0 },
    minimumQuantity: { type: Number, default: 0, min: 0 },
    
    // Restrictions
    applicableProducts: [{ type: Number }], // Empty = all products
    applicableCategories: [{ type: Number }], // Empty = all categories
    excludedProducts: [{ type: Number }],
    excludedCategories: [{ type: Number }],
    
    // User restrictions
    applicableUsers: [{ type: Number }], // Empty = all users
    firstOrderOnly: { type: Boolean, default: false },
    
    // Status
    isActive: { type: Boolean, default: true, index: true },
    
    // Tracking
    createdBy: { type: Number },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
CouponSchema.index({ code: 1 });
CouponSchema.index({ startDate: 1, endDate: 1 });
CouponSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

// Virtual for is valid (date-wise)
CouponSchema.virtual('isValid').get(function() {
  const now = new Date();
  const validStart = !this.startDate || this.startDate <= now;
  const validEnd = !this.endDate || this.endDate >= now;
  const notExhausted = !this.usageLimit || this.usedCount < this.usageLimit;
  return this.isActive && validStart && validEnd && notExhausted;
});

// Virtual for discount display
CouponSchema.virtual('discountDisplay').get(function() {
  switch (this.discountType) {
    case 'percentage':
      return `${this.discountValue}% OFF`;
    case 'fixed':
      return `$${this.discountValue} OFF`;
    case 'free_shipping':
      return 'FREE SHIPPING';
    case 'buy_x_get_y':
      return `Buy ${this.buyQuantity} Get ${this.getQuantity} Free`;
    default:
      return '';
  }
});

// Instance method to validate coupon for an order
CouponSchema.methods.validateForOrder = function(order, userId, userOrderCount) {
  const errors = [];
  const now = new Date();
  
  // Check if active
  if (!this.isActive) {
    errors.push('This coupon is no longer active');
  }
  
  // Check dates
  if (this.startDate && this.startDate > now) {
    errors.push('This coupon is not yet valid');
  }
  if (this.endDate && this.endDate < now) {
    errors.push('This coupon has expired');
  }
  
  // Check usage limit
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    errors.push('This coupon has reached its usage limit');
  }
  
  // Check minimum order amount
  if (this.minimumOrderAmount && order.subtotal < this.minimumOrderAmount) {
    errors.push(`Minimum order amount is $${this.minimumOrderAmount}`);
  }
  
  // Check minimum quantity
  if (this.minimumQuantity) {
    const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQty < this.minimumQuantity) {
      errors.push(`Minimum ${this.minimumQuantity} items required`);
    }
  }
  
  // Check first order only
  if (this.firstOrderOnly && userOrderCount > 0) {
    errors.push('This coupon is for first orders only');
  }
  
  // Check user restrictions
  if (this.applicableUsers?.length > 0 && !this.applicableUsers.includes(userId)) {
    errors.push('This coupon is not available for your account');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Instance method to calculate discount
CouponSchema.methods.calculateDiscount = function(order) {
  let discount = 0;
  
  // Filter applicable items
  let applicableItems = order.items;
  
  if (this.applicableProducts?.length > 0) {
    applicableItems = applicableItems.filter(item => 
      this.applicableProducts.includes(item.productId)
    );
  }
  
  if (this.excludedProducts?.length > 0) {
    applicableItems = applicableItems.filter(item => 
      !this.excludedProducts.includes(item.productId)
    );
  }
  
  const applicableSubtotal = applicableItems.reduce((sum, item) => sum + item.subtotal, 0);
  
  switch (this.discountType) {
    case 'percentage':
      discount = applicableSubtotal * (this.discountValue / 100);
      if (this.maxDiscount) {
        discount = Math.min(discount, this.maxDiscount);
      }
      break;
      
    case 'fixed':
      discount = Math.min(this.discountValue, applicableSubtotal);
      break;
      
    case 'free_shipping':
      discount = order.shippingCost || 0;
      break;
      
    case 'buy_x_get_y':
      // Complex logic - simplified version
      const eligibleQty = applicableItems.reduce((sum, item) => sum + item.quantity, 0);
      const sets = Math.floor(eligibleQty / (this.buyQuantity + this.getQuantity));
      // Would need product prices to calculate exact discount
      break;
  }
  
  return Math.round(discount * 100) / 100;
};

// Instance method to increment usage
CouponSchema.methods.incrementUsage = async function() {
  this.usedCount += 1;
  await this.save();
};

// Static method to find valid coupon by code
CouponSchema.statics.findValidByCode = async function(code) {
  const now = new Date();
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
    $or: [
      { startDate: { $lte: now } },
      { startDate: null },
    ],
    $or: [
      { endDate: { $gte: now } },
      { endDate: null },
    ],
  });
};

module.exports = mongoose.model('Coupon', CouponSchema);


