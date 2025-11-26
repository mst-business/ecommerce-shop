/**
 * Database Restore Script
 * 
 * Restores data from a JSON backup.
 * Run with: node scripts/restore-database.js <backup-folder>
 * Example: node scripts/restore-database.js 2024-01-15T10-30-00-000Z
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { connectDatabase } = require('../server/config/database');

// Collections to restore
const collections = [
  'counters', // Restore first
  'users',
  'categories',
  'products', 
  'carts',
  'orders',
  'ratings',
];

async function restoreDatabase() {
  const backupFolder = process.argv[2];
  
  if (!backupFolder) {
    console.error('❌ Please provide a backup folder name');
    console.log('Usage: node scripts/restore-database.js <backup-folder>');
    console.log('\nAvailable backups:');
    
    const backupsDir = path.join(__dirname, '..', 'backups');
    if (fs.existsSync(backupsDir)) {
      const backups = fs.readdirSync(backupsDir);
      backups.forEach(b => console.log(`   - ${b}`));
    } else {
      console.log('   No backups found');
    }
    
    process.exit(1);
  }
  
  const backupDir = path.join(__dirname, '..', 'backups', backupFolder);
  
  if (!fs.existsSync(backupDir)) {
    console.error(`❌ Backup folder not found: ${backupDir}`);
    process.exit(1);
  }
  
  console.log('🚀 Starting Database Restore...');
  console.log('================================');
  console.log(`📁 Restoring from: ${backupDir}`);
  console.log('\n⚠️  WARNING: This will REPLACE existing data!\n');
  
  // Confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const confirmed = await new Promise(resolve => {
    rl.question('Type "RESTORE" to confirm: ', answer => {
      rl.close();
      resolve(answer === 'RESTORE');
    });
  });
  
  if (!confirmed) {
    console.log('❌ Restore cancelled');
    process.exit(0);
  }
  
  try {
    await connectDatabase();
    console.log('\n✅ Connected to database');
    
    const summary = {};
    
    for (const collectionName of collections) {
      const filePath = path.join(backupDir, `${collectionName}.json`);
      
      if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️ ${collectionName}: No backup file found, skipping`);
        summary[collectionName] = 0;
        continue;
      }
      
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (data.length === 0) {
          console.log(`   ⚠️ ${collectionName}: Empty backup, skipping`);
          summary[collectionName] = 0;
          continue;
        }
        
        const collection = mongoose.connection.collection(collectionName);
        
        // Drop existing collection
        try {
          await collection.drop();
        } catch (e) {
          // Collection might not exist
        }
        
        // Insert backup data
        await collection.insertMany(data);
        
        summary[collectionName] = data.length;
        console.log(`   ✅ ${collectionName}: ${data.length} documents restored`);
      } catch (error) {
        console.error(`   ❌ ${collectionName}: Failed - ${error.message}`);
        summary[collectionName] = 'FAILED';
      }
    }
    
    console.log('\n================================');
    console.log('✅ Restore Complete!');
    console.log('================================');
    console.log('\nSummary:');
    Object.entries(summary).forEach(([name, count]) => {
      console.log(`   ${name}: ${count}`);
    });
    
  } catch (error) {
    console.error('\n❌ Restore failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Run restore
restoreDatabase();

