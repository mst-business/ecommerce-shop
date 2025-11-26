/**
 * Database Migration Script
 * 
 * This script migrates existing data to work with the new schema.
 * Run with: node scripts/migrate-database.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDatabase } = require('../server/config/database');

// Import models
const User = require('../server/models/User');
const Product = require('../server/models/Product');
const Category = require('../server/models/Category');
const Order = require('../server/models/Order');
const Cart = require('../server/models/Cart');
const Rating = require('../server/models/Rating');

// Helper to generate slug
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Helper to generate order number
function generateOrderNumber(createdAt) {
  const date = new Date(createdAt);
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${year}${month}-${random}`;
}

// Migration functions
const migrations = {
  /**
   * Migrate Users - Add new fields with defaults
   */
  async migrateUsers() {
    console.log('\n📦 Migrating Users...');
    
    const result = await User.updateMany(
      { isDeleted: { $exists: false } },
      {
        $set: {
          isDeleted: false,
          isActive: true,
          isEmailVerified: false,
          failedLoginAttempts: 0,
          preferences: {
            newsletter: true,
            notifications: true,
            currency: 'USD',
            language: 'en',
          },
        },
      }
    );
    
    console.log(`   ✅ Updated ${result.modifiedCount} users`);
    return result.modifiedCount;
  },

  /**
   * Migrate Products - Add slugs and new fields
   */
  async migrateProducts() {
    console.log('\n📦 Migrating Products...');
    
    // First, add default fields
    const defaultsResult = await Product.updateMany(
      { isDeleted: { $exists: false } },
      {
        $set: {
          isDeleted: false,
          trackInventory: true,
          allowBackorder: false,
          hasVariants: false,
          featured: false,
          isNew: false,
          viewCount: 0,
          salesCount: 0,
          lowStockThreshold: 5,
        },
      }
    );
    
    console.log(`   ✅ Added default fields to ${defaultsResult.modifiedCount} products`);
    
    // Now generate slugs for products without them
    const productsWithoutSlug = await Product.find({ 
      slug: { $exists: false } 
    }).select('id name');
    
    let slugCount = 0;
    for (const product of productsWithoutSlug) {
      const baseSlug = generateSlug(product.name);
      let slug = baseSlug;
      let counter = 1;
      
      // Ensure unique slug
      while (await Product.exists({ slug, id: { $ne: product.id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      await Product.updateOne(
        { id: product.id },
        { $set: { slug } }
      );
      slugCount++;
    }
    
    console.log(`   ✅ Generated slugs for ${slugCount} products`);
    
    // Migrate image to images array
    const productsWithImage = await Product.find({
      image: { $exists: true, $ne: '' },
      'images.0': { $exists: false },
    }).select('id image');
    
    let imageCount = 0;
    for (const product of productsWithImage) {
      await Product.updateOne(
        { id: product.id },
        {
          $set: {
            images: [{
              url: product.image,
              isPrimary: true,
              sortOrder: 0,
            }],
          },
        }
      );
      imageCount++;
    }
    
    console.log(`   ✅ Migrated images for ${imageCount} products`);
    
    return defaultsResult.modifiedCount + slugCount + imageCount;
  },

  /**
   * Migrate Categories - Add hierarchy and slugs
   */
  async migrateCategories() {
    console.log('\n📦 Migrating Categories...');
    
    // Add default fields
    const defaultsResult = await Category.updateMany(
      { isDeleted: { $exists: false } },
      {
        $set: {
          isDeleted: false,
          isActive: true,
          isFeatured: false,
          level: 0,
          sortOrder: 0,
          productCount: 0,
        },
      }
    );
    
    console.log(`   ✅ Added default fields to ${defaultsResult.modifiedCount} categories`);
    
    // Generate slugs
    const categoriesWithoutSlug = await Category.find({ 
      slug: { $exists: false } 
    }).select('id name');
    
    let slugCount = 0;
    for (const category of categoriesWithoutSlug) {
      const baseSlug = generateSlug(category.name);
      let slug = baseSlug;
      let counter = 1;
      
      while (await Category.exists({ slug, id: { $ne: category.id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      await Category.updateOne(
        { id: category.id },
        { 
          $set: { 
            slug,
            path: `/${category.id}`,
          } 
        }
      );
      slugCount++;
    }
    
    console.log(`   ✅ Generated slugs for ${slugCount} categories`);
    
    // Update product counts
    const categories = await Category.find().select('id');
    let countUpdates = 0;
    
    for (const category of categories) {
      const count = await Product.countDocuments({ 
        categoryId: category.id,
        isDeleted: { $ne: true },
        active: true,
      });
      
      await Category.updateOne(
        { id: category.id },
        { $set: { productCount: count } }
      );
      countUpdates++;
    }
    
    console.log(`   ✅ Updated product counts for ${countUpdates} categories`);
    
    return defaultsResult.modifiedCount + slugCount + countUpdates;
  },

  /**
   * Migrate Orders - Add order numbers and status history
   */
  async migrateOrders() {
    console.log('\n📦 Migrating Orders...');
    
    // Add default fields
    const defaultsResult = await Order.updateMany(
      { isDeleted: { $exists: false } },
      {
        $set: {
          isDeleted: false,
          sameAsShipping: true,
        },
      }
    );
    
    console.log(`   ✅ Added default fields to ${defaultsResult.modifiedCount} orders`);
    
    // Generate order numbers
    const ordersWithoutNumber = await Order.find({ 
      orderNumber: { $exists: false } 
    }).select('id createdAt');
    
    let orderNumberCount = 0;
    for (const order of ordersWithoutNumber) {
      const orderNumber = generateOrderNumber(order.createdAt);
      
      await Order.updateOne(
        { id: order.id },
        { $set: { orderNumber } }
      );
      orderNumberCount++;
    }
    
    console.log(`   ✅ Generated order numbers for ${orderNumberCount} orders`);
    
    // Add status history for orders without it
    const ordersWithoutHistory = await Order.find({ 
      'statusHistory.0': { $exists: false } 
    }).select('id status createdAt');
    
    let historyCount = 0;
    for (const order of ordersWithoutHistory) {
      await Order.updateOne(
        { id: order.id },
        {
          $set: {
            statusHistory: [{
              status: order.status,
              note: 'Order placed (migrated)',
              changedAt: order.createdAt,
            }],
          },
        }
      );
      historyCount++;
    }
    
    console.log(`   ✅ Added status history to ${historyCount} orders`);
    
    // Migrate legacy shippingAddress format
    const ordersWithLegacyAddress = await Order.find({
      'shippingAddress.fullName': { $exists: false },
      'shippingAddress.address': { $exists: true },
    }).select('id shippingAddress');
    
    let addressCount = 0;
    for (const order of ordersWithLegacyAddress) {
      const oldAddr = order.shippingAddress;
      
      await Order.updateOne(
        { id: order.id },
        {
          $set: {
            shippingAddress: {
              fullName: oldAddr.fullName || oldAddr.name || 'Unknown',
              addressLine1: oldAddr.address || oldAddr.addressLine1 || '',
              addressLine2: oldAddr.addressLine2 || '',
              city: oldAddr.city || '',
              state: oldAddr.state || '',
              zipCode: oldAddr.zipCode || oldAddr.zip || '',
              country: oldAddr.country || 'USA',
            },
          },
        }
      );
      addressCount++;
    }
    
    console.log(`   ✅ Migrated ${addressCount} legacy addresses`);
    
    // Calculate subtotals if missing
    const ordersWithoutSubtotal = await Order.find({
      subtotal: { $exists: false },
    }).select('id items total');
    
    let subtotalCount = 0;
    for (const order of ordersWithoutSubtotal) {
      const subtotal = order.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
      
      await Order.updateOne(
        { id: order.id },
        {
          $set: {
            subtotal,
            discount: 0,
            shippingCost: 0,
            tax: 0,
          },
        }
      );
      subtotalCount++;
    }
    
    console.log(`   ✅ Calculated subtotals for ${subtotalCount} orders`);
    
    return defaultsResult.modifiedCount + orderNumberCount + historyCount + addressCount + subtotalCount;
  },

  /**
   * Migrate Ratings - Add new fields
   */
  async migrateRatings() {
    console.log('\n📦 Migrating Ratings...');
    
    const result = await Rating.updateMany(
      { isDeleted: { $exists: false } },
      {
        $set: {
          isDeleted: false,
          status: 'approved',
          isVerifiedPurchase: false,
          notHelpful: 0,
        },
      }
    );
    
    console.log(`   ✅ Updated ${result.modifiedCount} ratings`);
    return result.modifiedCount;
  },

  /**
   * Migrate Carts - Add new fields
   */
  async migrateCarts() {
    console.log('\n📦 Migrating Carts...');
    
    const result = await Cart.updateMany(
      { lastActivityAt: { $exists: false } },
      {
        $set: {
          lastActivityAt: new Date(),
          abandonmentEmailSent: false,
          savedItems: [],
          couponCode: null,
          couponDiscount: 0,
        },
      }
    );
    
    console.log(`   ✅ Updated ${result.modifiedCount} carts`);
    return result.modifiedCount;
  },
};

// Main migration function
async function runMigration() {
  console.log('🚀 Starting Database Migration...');
  console.log('================================');
  
  try {
    await connectDatabase();
    console.log('✅ Connected to database');
    
    const results = {
      users: await migrations.migrateUsers(),
      products: await migrations.migrateProducts(),
      categories: await migrations.migrateCategories(),
      orders: await migrations.migrateOrders(),
      ratings: await migrations.migrateRatings(),
      carts: await migrations.migrateCarts(),
    };
    
    console.log('\n================================');
    console.log('✅ Migration Complete!');
    console.log('================================');
    console.log('\nSummary:');
    console.log(`   Users:      ${results.users} updated`);
    console.log(`   Products:   ${results.products} updated`);
    console.log(`   Categories: ${results.categories} updated`);
    console.log(`   Orders:     ${results.orders} updated`);
    console.log(`   Ratings:    ${results.ratings} updated`);
    console.log(`   Carts:      ${results.carts} updated`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Run migration
runMigration();


