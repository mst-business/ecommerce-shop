const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true, index: true },
    productId: { type: Number, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, default: '' },
  },
  { timestamps: true }
);

// Compound index to ensure one rating per user per product
RatingSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', RatingSchema);

