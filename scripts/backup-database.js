/**
 * Database Backup Script
 * 
 * Creates a JSON backup of all collections before migration.
 * Run with: node scripts/backup-database.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { connectDatabase } = require('../server/config/database');

// Collections to backup
const collections = [
  'users',
  'products', 
  'categories',
  'orders',
  'carts',
  'ratings',
  'counters',
];

async function backupDatabase() {
  console.log('🚀 Starting Database Backup...');
  console.log('================================');
  
  try {
    await connectDatabase();
    console.log('✅ Connected to database');
    
    // Create backup directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '..', 'backups', timestamp);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    console.log(`\n📁 Backup directory: ${backupDir}\n`);
    
    const summary = {};
    
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.collection(collectionName);
        const documents = await collection.find({}).toArray();
        
        const filePath = path.join(backupDir, `${collectionName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
        
        summary[collectionName] = documents.length;
        console.log(`   ✅ ${collectionName}: ${documents.length} documents`);
      } catch (error) {
        console.log(`   ⚠️ ${collectionName}: Collection not found or empty`);
        summary[collectionName] = 0;
      }
    }
    
    // Write summary file
    const summaryPath = path.join(backupDir, '_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      collections: summary,
      totalDocuments: Object.values(summary).reduce((a, b) => a + b, 0),
    }, null, 2));
    
    console.log('\n================================');
    console.log('✅ Backup Complete!');
    console.log('================================');
    console.log(`\nTotal documents backed up: ${Object.values(summary).reduce((a, b) => a + b, 0)}`);
    console.log(`Backup location: ${backupDir}`);
    
  } catch (error) {
    console.error('\n❌ Backup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Run backup
backupDatabase();

