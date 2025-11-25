const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    userId: { type: Number, required: true, index: true },
    productId: { type: Number, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, maxlength: 1000 },
    helpful: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index to ensure one rating per user per product
RatingSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', RatingSchema);
