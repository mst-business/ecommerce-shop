/**
 * Setup Demo Users Script
 * 
 * Creates demo customer and admin accounts for testing.
 * Run with: node scripts/setup-demo-users.js
 */

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { connectDatabase } = require('../server/config/database');

const DEMO_USERS = [
  {
    username: 'customer',
    email: 'customer@example.com',
    password: 'password123',
    firstName: 'Demo',
    lastName: 'Customer',
    role: 'customer',
  },
  {
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
  },
];

async function getNextUserId(countersCollection) {
  const counter = await countersCollection.findOneAndUpdate(
    { key: 'user' },
    { $inc: { value: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return counter.value;
}

async function setupDemoUsers() {
  console.log('🚀 Setting up Demo Users...');
  console.log('================================\n');

  try {
    await connectDatabase();
    console.log('✅ Connected to database\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const countersCollection = db.collection('counters');

    for (const demoUser of DEMO_USERS) {
      console.log(`📦 Processing ${demoUser.role}: ${demoUser.username}`);

      // Check if user exists
      const existingUser = await usersCollection.findOne({ 
        $or: [
          { username: demoUser.username },
          { email: demoUser.email },
        ]
      });

      if (existingUser) {
        // Update role if needed
        if (existingUser.role !== demoUser.role) {
          await usersCollection.updateOne(
            { _id: existingUser._id },
            { $set: { role: demoUser.role } }
          );
          console.log(`   ✅ Updated role to '${demoUser.role}'`);
        } else {
          console.log(`   ℹ️  Already exists with correct role`);
        }
      } else {
        // Create new user
        const hashedPassword = await bcrypt.hash(demoUser.password, 10);
        const userId = await getNextUserId(countersCollection);

        await usersCollection.insertOne({
          id: userId,
          username: demoUser.username,
          email: demoUser.email,
          password: hashedPassword,
          firstName: demoUser.firstName,
          lastName: demoUser.lastName,
          role: demoUser.role,
          isActive: true,
          isDeleted: false,
          isEmailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log(`   ✅ Created new user (ID: ${userId})`);
      }
    }

    console.log('\n================================');
    console.log('✅ Demo Users Setup Complete!');
    console.log('================================\n');

    console.log('📋 Demo Credentials:');
    console.log('─────────────────────────────────');
    console.log('│ CUSTOMER ACCOUNT              │');
    console.log('│ Username: customer            │');
    console.log('│ Password: password123         │');
    console.log('│ Email: customer@example.com   │');
    console.log('─────────────────────────────────');
    console.log('│ ADMIN ACCOUNT                 │');
    console.log('│ Username: admin               │');
    console.log('│ Password: admin123            │');
    console.log('│ Email: admin@example.com      │');
    console.log('─────────────────────────────────');
    console.log('\n⚠️  Change these passwords in production!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

setupDemoUsers();


