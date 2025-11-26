/**
 * Rating/Review Model
 */
const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    userId: { type: Number, required: true, index: true },
    productId: { type: Number, required: true, index: true },
    orderId: { type: Number, index: true }, // Link to verified purchase
    
    // Rating
    rating: { type: Number, required: true, min: 1, max: 5 },
    
    // Review content
    title: { type: String, maxlength: 100, trim: true },
    review: { type: String, maxlength: 2000, trim: true },
    
    // Pros and cons
    pros: [{ type: String, maxlength: 100, trim: true }],
    cons: [{ type: String, maxlength: 100, trim: true }],
    
    // Images attached to review
    images: [{
      url: { type: String, required: true },
      caption: { type: String, maxlength: 100 },
    }],
    
    // Engagement
    helpful: { type: Number, default: 0, min: 0 },
    notHelpful: { type: Number, default: 0, min: 0 },
    helpfulVotes: [{ 
      userId: Number, 
      vote: { type: String, enum: ['helpful', 'not_helpful'] },
      votedAt: { type: Date, default: Date.now },
    }],
    
    // Verification
    isVerifiedPurchase: { type: Boolean, default: false },
    
    // Moderation
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'approved', // Auto-approve by default
      index: true,
    },
    moderatedBy: { type: Number },
    moderatedAt: { type: Date },
    rejectionReason: { type: String },
    
    // Admin response
    adminResponse: {
      text: { type: String, maxlength: 1000 },
      respondedBy: { type: Number },
      respondedAt: { type: Date },
    },
    
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

// Compound index to ensure one rating per user per product
RatingSchema.index({ userId: 1, productId: 1 }, { unique: true });
RatingSchema.index({ productId: 1, status: 1, createdAt: -1 });
RatingSchema.index({ rating: 1 });

// Virtual for helpfulness score
RatingSchema.virtual('helpfulnessScore').get(function() {
  const total = this.helpful + this.notHelpful;
  if (total === 0) return 0;
  return Math.round((this.helpful / total) * 100);
});

// Don't return deleted ratings by default
RatingSchema.pre(/^find/, function(next) {
  if (!this.getQuery().isDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// Instance method to vote helpful
RatingSchema.methods.voteHelpful = async function(userId, vote) {
  // Remove existing vote from this user
  this.helpfulVotes = this.helpfulVotes.filter(v => v.userId !== userId);
  
  // Add new vote
  this.helpfulVotes.push({ userId, vote });
  
  // Recalculate counts
  this.helpful = this.helpfulVotes.filter(v => v.vote === 'helpful').length;
  this.notHelpful = this.helpfulVotes.filter(v => v.vote === 'not_helpful').length;
  
  await this.save();
  return this;
};

// Static method to get rating distribution for a product
RatingSchema.statics.getRatingDistribution = async function(productId) {
  const distribution = await this.aggregate([
    { $match: { productId, status: 'approved', isDeleted: { $ne: true } } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);
  
  // Convert to object with all ratings 1-5
  const result = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distribution.forEach(d => {
    result[d._id] = d.count;
  });
  
  return result;
};

module.exports = mongoose.model('Rating', RatingSchema);
