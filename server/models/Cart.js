/**
 * Cart Model
 */
const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true, index: true },
    quantity: { type: Number, required: true, min: 1, max: 99 },
    
    // Variant selection
    variantId: { type: mongoose.Schema.Types.ObjectId },
    variantName: { type: String },
    variantValue: { type: String },
    
    // Price at time of adding (for comparison)
    priceAtAdd: { type: Number },
    
    // Custom notes
    note: { type: String, maxlength: 200, trim: true },
    
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const CartSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true, unique: true, index: true },
    items: { 
      type: [CartItemSchema], 
      default: [],
      validate: [val => val.length <= 50, 'Maximum 50 items in cart'],
    },
    
    // Applied coupon
    couponCode: { type: String },
    couponDiscount: { type: Number, default: 0 },
    
    // Saved for later
    savedItems: {
      type: [CartItemSchema],
      default: [],
      validate: [val => val.length <= 50, 'Maximum 50 saved items'],
    },
    
    // Cart abandonment tracking
    lastActivityAt: { type: Date, default: Date.now },
    abandonmentEmailSent: { type: Boolean, default: false },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
CartSchema.index({ lastActivityAt: 1 });
CartSchema.index({ 'items.productId': 1 });

// Virtual for item count
CartSchema.virtual('itemCount').get(function() {
  return this.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
});

// Virtual for unique item count
CartSchema.virtual('uniqueItemCount').get(function() {
  return this.items?.length || 0;
});

// Update last activity on save
CartSchema.pre('save', function(next) {
  this.lastActivityAt = new Date();
  next();
});

// Instance method to add item
CartSchema.methods.addItem = async function(productId, quantity, options = {}) {
  const existingIndex = this.items.findIndex(
    item => item.productId === productId && 
            item.variantId?.toString() === options.variantId?.toString()
  );
  
  if (existingIndex > -1) {
    // Update quantity
    this.items[existingIndex].quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      productId,
      quantity,
      variantId: options.variantId,
      variantName: options.variantName,
      variantValue: options.variantValue,
      priceAtAdd: options.price,
      note: options.note,
    });
  }
  
  await this.save();
  return this;
};

// Instance method to update item quantity
CartSchema.methods.updateQuantity = async function(productId, quantity, variantId) {
  const item = this.items.find(
    item => item.productId === productId && 
            item.variantId?.toString() === variantId?.toString()
  );
  
  if (item) {
    if (quantity <= 0) {
      return this.removeItem(productId, variantId);
    }
    item.quantity = quantity;
    await this.save();
  }
  
  return this;
};

// Instance method to remove item
CartSchema.methods.removeItem = async function(productId, variantId) {
  this.items = this.items.filter(
    item => !(item.productId === productId && 
              item.variantId?.toString() === variantId?.toString())
  );
  await this.save();
  return this;
};

// Instance method to move item to saved
CartSchema.methods.saveForLater = async function(productId, variantId) {
  const itemIndex = this.items.findIndex(
    item => item.productId === productId && 
            item.variantId?.toString() === variantId?.toString()
  );
  
  if (itemIndex > -1) {
    const [item] = this.items.splice(itemIndex, 1);
    this.savedItems.push(item);
    await this.save();
  }
  
  return this;
};

// Instance method to move item back to cart
CartSchema.methods.moveToCart = async function(productId, variantId) {
  const itemIndex = this.savedItems.findIndex(
    item => item.productId === productId && 
            item.variantId?.toString() === variantId?.toString()
  );
  
  if (itemIndex > -1) {
    const [item] = this.savedItems.splice(itemIndex, 1);
    item.addedAt = new Date();
    this.items.push(item);
    await this.save();
  }
  
  return this;
};

// Instance method to clear cart
CartSchema.methods.clear = async function() {
  this.items = [];
  this.couponCode = null;
  this.couponDiscount = 0;
  await this.save();
  return this;
};

// Instance method to apply coupon
CartSchema.methods.applyCoupon = async function(code, discount) {
  this.couponCode = code;
  this.couponDiscount = discount;
  await this.save();
  return this;
};

// Instance method to remove coupon
CartSchema.methods.removeCoupon = async function() {
  this.couponCode = null;
  this.couponDiscount = 0;
  await this.save();
  return this;
};

// Static method to find abandoned carts
CartSchema.statics.findAbandoned = async function(hoursAgo = 24) {
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  return this.find({
    'items.0': { $exists: true },
    lastActivityAt: { $lt: cutoff },
    abandonmentEmailSent: false,
  });
};

module.exports = mongoose.model('Cart', CartSchema);
