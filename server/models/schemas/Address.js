/**
 * Reusable Address Schema
 */
const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, default: 'USA', trim: true },
    isDefault: { type: Boolean, default: false },
    type: { 
      type: String, 
      enum: ['shipping', 'billing', 'both'],
      default: 'both',
    },
  },
  { _id: false }
);

// Virtual for formatted address
AddressSchema.virtual('formatted').get(function() {
  const parts = [
    this.fullName,
    this.addressLine1,
    this.addressLine2,
    `${this.city}, ${this.state} ${this.zipCode}`,
    this.country,
  ].filter(Boolean);
  return parts.join('\n');
});

module.exports = AddressSchema;
