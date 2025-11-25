const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    categoryId: { type: Number, required: true, index: true },
    stock: { type: Number, default: 0 },
    image: { type: String },
    active: { type: Boolean, default: true, index: true },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ averageRating: -1 }); // Index for sorting by rating

module.exports = mongoose.model('Product', ProductSchema);


