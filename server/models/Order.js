/**
 * Order Model
 */
const mongoose = require('mongoose');
const AddressSchema = require('./schemas/Address');

// Order item schema
const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true, index: true },
    productName: { type: String, required: true },
    sku: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    image: { type: String },
    variant: {
      name: { type: String },
      value: { type: String },
    },
  },
  { _id: false }
);

// Status history schema
const StatusHistorySchema = new mongoose.Schema(
  {
    status: { 
      type: String, 
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded', 'returned'],
      required: true,
    },
    note: { type: String, maxlength: 500 },
    changedBy: { type: Number }, // User ID who made the change
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Shipping info schema
const ShippingInfoSchema = new mongoose.Schema(
  {
    carrier: { type: String }, // e.g., "UPS", "FedEx", "USPS"
    trackingNumber: { type: String },
    trackingUrl: { type: String },
    estimatedDelivery: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { _id: false }
);

// Payment info schema
const PaymentInfoSchema = new mongoose.Schema(
  {
    method: { 
      type: String, 
      enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'],
      default: 'credit_card',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: { type: String },
    paidAt: { type: Date },
    refundedAt: { type: Date },
    refundAmount: { type: Number },
    last4: { type: String }, // Last 4 digits of card
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    // Core fields
    id: { type: Number, unique: true, index: true },
    orderNumber: { type: String, unique: true }, // Human-readable order number
    
    // Customer
    userId: { type: Number, index: true },
    guestEmail: { type: String, index: true, lowercase: true },
    guestPhone: { type: String },
    isGuest: { type: Boolean, default: false },
    
    // Items
    items: { 
      type: [OrderItemSchema], 
      required: true,
      validate: [val => val.length > 0, 'Order must have at least one item'],
    },
    
    // Pricing
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    discountCode: { type: String },
    shippingCost: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    
    // Addresses
    shippingAddress: { type: AddressSchema, required: true },
    billingAddress: { type: AddressSchema },
    sameAsShipping: { type: Boolean, default: true },
    
    // Status
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded', 'returned'],
      default: 'pending',
      index: true,
    },
    statusHistory: {
      type: [StatusHistorySchema],
      default: [],
    },
    
    // Shipping
    shipping: { type: ShippingInfoSchema },
    
    // Payment
    payment: { type: PaymentInfoSchema },
    paymentMethod: { type: String }, // Legacy field for backwards compatibility
    
    // Notes
    customerNote: { type: String, maxlength: 1000 },
    internalNote: { type: String, maxlength: 1000 },
    
    // Cancellation
    cancelledAt: { type: Date },
    cancelReason: { type: String },
    cancelledBy: { type: Number },
    
    // Soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for common queries
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ guestEmail: 1, isGuest: 1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ 'payment.status': 1 });

// Virtual for customer email
OrderSchema.virtual('customerEmail').get(function() {
  return this.guestEmail || null; // Would need to populate user for non-guest
});

// Virtual for item count
OrderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for can be cancelled
OrderSchema.virtual('canCancel').get(function() {
  return ['pending', 'confirmed', 'processing'].includes(this.status);
});

// Virtual for can be refunded
OrderSchema.virtual('canRefund').get(function() {
  return ['delivered', 'shipped'].includes(this.status) && 
         this.payment?.status === 'completed';
});

// Generate order number before saving
OrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD-${year}${month}-${random}`;
  }
  
  // Calculate totals
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    this.total = this.subtotal - (this.discount || 0) + (this.shippingCost || 0) + (this.tax || 0);
  }
  
  // Add initial status to history if new
  if (this.isNew) {
    this.statusHistory = [{
      status: this.status,
      note: 'Order placed',
      changedAt: new Date(),
    }];
  }
  
  next();
});

// Instance method to update status
OrderSchema.methods.updateStatus = async function(newStatus, note, userId) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  this.statusHistory.push({
    status: newStatus,
    note: note || `Status changed from ${oldStatus} to ${newStatus}`,
    changedBy: userId,
    changedAt: new Date(),
  });
  
  // Update related timestamps
  if (newStatus === 'shipped' && this.shipping) {
    this.shipping.shippedAt = new Date();
  }
  if (newStatus === 'delivered' && this.shipping) {
    this.shipping.deliveredAt = new Date();
  }
  if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
    this.cancelledBy = userId;
  }
  
  await this.save();
  return this;
};

// Instance method to add tracking info
OrderSchema.methods.addTracking = async function(carrier, trackingNumber, trackingUrl, estimatedDelivery) {
  if (!this.shipping) this.shipping = {};
  
  this.shipping.carrier = carrier;
  this.shipping.trackingNumber = trackingNumber;
  this.shipping.trackingUrl = trackingUrl;
  if (estimatedDelivery) this.shipping.estimatedDelivery = estimatedDelivery;
  
  await this.save();
  return this;
};

module.exports = mongoose.model('Order', OrderSchema);
