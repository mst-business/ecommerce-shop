/**
 * Migration script to add stock and active fields to existing products
 * 
 * Run with: node scripts/fix-product-stock.js
 */

require('dotenv').config();

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;

async function fixProductStock() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('Database:', MONGO_DB_NAME);
    
    await mongoose.connect(MONGO_URI, {
      dbName: MONGO_DB_NAME,
    });
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');

    // Find all products without stock field or with stock = null/undefined
    const productsWithoutStock = await productsCollection.countDocuments({
      $or: [
        { stock: { $exists: false } },
        { stock: null }
      ]
    });

    console.log(`Found ${productsWithoutStock} products without stock field`);

    if (productsWithoutStock > 0) {
      // Update all products that don't have stock to have stock = 50 (default)
      const stockResult = await productsCollection.updateMany(
        {
          $or: [
            { stock: { $exists: false } },
            { stock: null }
          ]
        },
        {
          $set: { stock: 50 }
        }
      );
      console.log(`✓ Updated ${stockResult.modifiedCount} products with default stock (50)`);
    }

    // Find all products without active field
    const productsWithoutActive = await productsCollection.countDocuments({
      $or: [
        { active: { $exists: false } },
        { active: null }
      ]
    });

    console.log(`Found ${productsWithoutActive} products without active field`);

    if (productsWithoutActive > 0) {
      // Update all products that don't have active to have active = true
      const activeResult = await productsCollection.updateMany(
        {
          $or: [
            { active: { $exists: false } },
            { active: null }
          ]
        },
        {
          $set: { active: true }
        }
      );
      console.log(`✓ Updated ${activeResult.modifiedCount} products with active = true`);
    }

    // Show all products after update
    const allProducts = await productsCollection.find({}).toArray();
    console.log('\n--- Current Products ---');
    allProducts.forEach(p => {
      console.log(`  ID: ${p.id}, Name: ${p.name}, Stock: ${p.stock}, Active: ${p.active}`);
    });

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixProductStock();

