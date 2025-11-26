/**
 * Category Model
 */
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    // Core fields
    id: { type: Number, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    description: { type: String, maxlength: 1000 },
    
    // Hierarchy
    parentId: { type: Number, default: null, index: true },
    level: { type: Number, default: 0 }, // 0 = root, 1 = child, 2 = grandchild
    path: { type: String }, // e.g., "/1/5/12" for breadcrumb
    
    // Display
    image: { type: String },
    icon: { type: String },
    color: { type: String }, // Hex color for category badge
    sortOrder: { type: Number, default: 0 },
    
    // Status
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
    
    // SEO
    metaTitle: { type: String, maxlength: 70 },
    metaDescription: { type: String, maxlength: 160 },
    
    // Stats (cached for performance)
    productCount: { type: Number, default: 0 },
    
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

// Indexes
CategorySchema.index({ parentId: 1, isActive: 1 });
CategorySchema.index({ slug: 1 });
CategorySchema.index({ sortOrder: 1 });
CategorySchema.index({ isFeatured: 1, isActive: 1 });

// Virtual for full path names (needs population)
CategorySchema.virtual('children', {
  ref: 'Category',
  localField: 'id',
  foreignField: 'parentId',
});

// Generate slug before saving
CategorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Don't return deleted categories by default
CategorySchema.pre(/^find/, function(next) {
  if (!this.getQuery().isDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// Static method to get category tree
CategorySchema.statics.getTree = async function() {
  const categories = await this.find({ isActive: true }).sort('sortOrder');
  
  const buildTree = (items, parentId = null) => {
    return items
      .filter(item => item.parentId === parentId)
      .map(item => ({
        ...item.toObject(),
        children: buildTree(items, item.id),
      }));
  };
  
  return buildTree(categories);
};

// Static method to get ancestors
CategorySchema.statics.getAncestors = async function(categoryId) {
  const category = await this.findOne({ id: categoryId });
  if (!category || !category.path) return [];
  
  const ancestorIds = category.path.split('/').filter(Boolean).map(Number);
  return this.find({ id: { $in: ancestorIds } }).sort('level');
};

// Instance method to update path
CategorySchema.methods.updatePath = async function() {
  if (this.parentId) {
    const parent = await this.constructor.findOne({ id: this.parentId });
    if (parent) {
      this.path = `${parent.path || ''}/${this.id}`;
      this.level = parent.level + 1;
    }
  } else {
    this.path = `/${this.id}`;
    this.level = 0;
  }
  await this.save();
};

module.exports = mongoose.model('Category', CategorySchema);
