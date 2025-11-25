const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    userId: { type: Number, index: true }, // Optional for guest orders
    // Guest order fields
    guestEmail: { type: String, index: true },
    guestPhone: { type: String },
    isGuest: { type: Boolean, default: false },
    items: { type: [OrderItemSchema], default: [] },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    shippingAddress: { type: mongoose.Schema.Types.Mixed },
    paymentMethod: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);


