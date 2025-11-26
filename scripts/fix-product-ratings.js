/**
 * Migration script to add rating fields to existing products
 * 
 * Run with: node scripts/fix-product-ratings.js
 */

require('dotenv').config();

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;

async function fixProductRatings() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('Database:', MONGO_DB_NAME);
    
    await mongoose.connect(MONGO_URI, {
      dbName: MONGO_DB_NAME,
    });
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');

    // Find all products without averageRating field
    const productsWithoutRating = await productsCollection.countDocuments({
      $or: [
        { averageRating: { $exists: false } },
        { averageRating: null }
      ]
    });

    console.log(`Found ${productsWithoutRating} products without averageRating field`);

    if (productsWithoutRating > 0) {
      const result = await productsCollection.updateMany(
        {
          $or: [
            { averageRating: { $exists: false } },
            { averageRating: null }
          ]
        },
        {
          $set: { averageRating: 0 }
        }
      );
      console.log(`✓ Updated ${result.modifiedCount} products with averageRating = 0`);
    }

    // Find all products without ratingCount field
    const productsWithoutCount = await productsCollection.countDocuments({
      $or: [
        { ratingCount: { $exists: false } },
        { ratingCount: null }
      ]
    });

    console.log(`Found ${productsWithoutCount} products without ratingCount field`);

    if (productsWithoutCount > 0) {
      const result = await productsCollection.updateMany(
        {
          $or: [
            { ratingCount: { $exists: false } },
            { ratingCount: null }
          ]
        },
        {
          $set: { ratingCount: 0 }
        }
      );
      console.log(`✓ Updated ${result.modifiedCount} products with ratingCount = 0`);
    }

    // Show all products after update
    const allProducts = await productsCollection.find({}, { 
      projection: { id: 1, name: 1, averageRating: 1, ratingCount: 1 } 
    }).toArray();
    
    console.log('\n--- Current Products ---');
    allProducts.forEach(p => {
      console.log(`  ID: ${p.id}, Name: ${p.name}, Rating: ${p.averageRating} (${p.ratingCount} reviews)`);
    });

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixProductRatings();


