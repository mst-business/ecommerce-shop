/**
 * Migration script to add roles to existing users and create/promote an admin user
 * 
 * Run with: node scripts/setup-admin-user.js
 * 
 * Options:
 *   --username <username>  Username to promote to admin (default: creates new 'admin' user)
 *   --create               Create a new admin user
 */

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;

// Parse command line arguments
const args = process.argv.slice(2);
const usernameIndex = args.indexOf('--username');
const targetUsername = usernameIndex !== -1 ? args[usernameIndex + 1] : null;
const createNew = args.includes('--create');

async function setupAdminUser() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('Database:', MONGO_DB_NAME);
    
    await mongoose.connect(MONGO_URI, {
      dbName: MONGO_DB_NAME,
    });
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const countersCollection = db.collection('counters');

    // Step 1: Add role field to all users who don't have it
    const usersWithoutRole = await usersCollection.countDocuments({
      $or: [
        { role: { $exists: false } },
        { role: null }
      ]
    });

    console.log(`Found ${usersWithoutRole} users without role field`);

    if (usersWithoutRole > 0) {
      const result = await usersCollection.updateMany(
        {
          $or: [
            { role: { $exists: false } },
            { role: null }
          ]
        },
        { $set: { role: 'customer' } }
      );
      console.log(`✓ Set ${result.modifiedCount} users to 'customer' role\n`);
    }

    // Step 2: Promote existing user to admin OR create new admin user
    if (targetUsername) {
      // Promote existing user
      const user = await usersCollection.findOne({ username: targetUsername });
      if (!user) {
        console.log(`❌ User '${targetUsername}' not found`);
        console.log('\nExisting users:');
        const allUsers = await usersCollection.find({}, { projection: { username: 1, email: 1, role: 1 } }).toArray();
        allUsers.forEach(u => console.log(`  - ${u.username} (${u.email}) - ${u.role || 'no role'}`));
      } else if (user.role === 'admin') {
        console.log(`ℹ User '${targetUsername}' is already an admin`);
      } else {
        await usersCollection.updateOne(
          { username: targetUsername },
          { $set: { role: 'admin' } }
        );
        console.log(`✓ Promoted '${targetUsername}' to admin role`);
      }
    } else if (createNew) {
      // Create new admin user
      const existingAdmin = await usersCollection.findOne({ username: 'admin' });
      if (existingAdmin) {
        if (existingAdmin.role === 'admin') {
          console.log("ℹ Admin user already exists with admin role");
        } else {
          await usersCollection.updateOne(
            { username: 'admin' },
            { $set: { role: 'admin' } }
          );
          console.log("✓ Existing 'admin' user promoted to admin role");
        }
      } else {
        // Get next user ID
        const counter = await countersCollection.findOneAndUpdate(
          { key: 'user' },
          { $inc: { value: 1 } },
          { upsert: true, returnDocument: 'after' }
        );
        const newId = counter.value;

        // Create admin user with hashed password
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await usersCollection.insertOne({
          id: newId,
          username: 'admin',
          email: 'admin@example.com',
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('\n✓ Created new admin user:');
        console.log('  Username: admin');
        console.log('  Password: admin123');
        console.log('  Email: admin@example.com');
        console.log('\n⚠️  Please change the password after first login!');
      }
    } else {
      // Show current users and instructions
      console.log('\n--- Current Users ---');
      const allUsers = await usersCollection.find({}, { projection: { username: 1, email: 1, role: 1, id: 1 } }).toArray();
      
      if (allUsers.length === 0) {
        console.log('No users found in database');
      } else {
        allUsers.forEach(u => {
          const roleLabel = u.role === 'admin' ? '👑 admin' : '👤 customer';
          console.log(`  ID: ${u.id} | ${u.username} (${u.email}) - ${roleLabel}`);
        });
      }
      
      console.log('\n--- Usage ---');
      console.log('To promote an existing user to admin:');
      console.log('  node scripts/setup-admin-user.js --username <username>');
      console.log('\nTo create a new admin user:');
      console.log('  node scripts/setup-admin-user.js --create');
    }

    console.log('\n✅ Done!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

setupAdminUser();

