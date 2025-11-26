/**
 * User Model
 */
const mongoose = require('mongoose');
const AddressSchema = require('./schemas/Address');

const UserSchema = new mongoose.Schema(
  {
    // Core fields
    id: { type: Number, unique: true, index: true },
    username: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true, select: false }, // Don't return password by default
    
    // Profile
    firstName: { type: String, trim: true, maxlength: 50 },
    lastName: { type: String, trim: true, maxlength: 50 },
    phone: { type: String, trim: true },
    avatar: { type: String }, // URL to avatar image
    dateOfBirth: { type: Date },
    
    // Role and permissions
    role: { 
      type: String, 
      enum: ['customer', 'admin', 'manager'],
      default: 'customer',
      index: true,
    },
    
    // Addresses
    addresses: {
      type: [AddressSchema],
      default: [],
      validate: [arrayLimit, '{PATH} exceeds the limit of 10'],
    },
    
    // Account status
    isActive: { type: Boolean, default: true, index: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },
    
    // Security
    lastLoginAt: { type: Date },
    lastLoginIp: { type: String },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    passwordChangedAt: { type: Date },
    
    // Soft delete
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    
    // Preferences
    preferences: {
      newsletter: { type: Boolean, default: true },
      notifications: { type: Boolean, default: true },
      currency: { type: String, default: 'USD' },
      language: { type: String, default: 'en' },
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Array limit validator
function arrayLimit(val) {
  return val.length <= 10;
}

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.lastName || this.username;
});

// Virtual for default shipping address
UserSchema.virtual('defaultAddress').get(function() {
  if (!this.addresses || this.addresses.length === 0) return null;
  return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
});

// Indexes for common queries
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ isDeleted: 1, isActive: 1 });

// Don't return deleted users by default
UserSchema.pre(/^find/, function(next) {
  // Only apply if not explicitly querying for deleted users
  if (!this.getQuery().isDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// Instance method to check if account is locked
UserSchema.methods.isLocked = function() {
  return this.lockedUntil && this.lockedUntil > new Date();
};

// Instance method to increment failed login attempts
UserSchema.methods.incrementFailedLogins = async function() {
  this.failedLoginAttempts += 1;
  
  // Lock account after 5 failed attempts for 30 minutes
  if (this.failedLoginAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
  }
  
  await this.save();
};

// Instance method to reset failed login attempts
UserSchema.methods.resetFailedLogins = async function() {
  this.failedLoginAttempts = 0;
  this.lockedUntil = null;
  this.lastLoginAt = new Date();
  await this.save();
};

module.exports = mongoose.model('User', UserSchema);
