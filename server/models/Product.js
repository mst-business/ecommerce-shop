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
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', ProductSchema);


