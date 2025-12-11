require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/crm_db';

async function fixUserPasswords() {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users in database`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      // Check if password is hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      const isHashed = user.password && (
        user.password.startsWith('$2a$') || 
        user.password.startsWith('$2b$') || 
        user.password.startsWith('$2y$')
      );

      if (!isHashed) {
        console.log(`\nFound user with plain text password: ${user.email}`);
        console.log(`Current password (plain text): ${user.password}`);
        
        // Hash the existing plain text password
        const hash = await bcrypt.hash(user.password, 10);
        user.password = hash;
        await user.save();
        
        console.log(`✓ Fixed password for user: ${user.email}`);
        fixedCount++;
      } else {
        console.log(`✓ User ${user.email} already has hashed password`);
        skippedCount++;
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total users: ${users.length}`);
    console.log(`Fixed (re-hashed): ${fixedCount}`);
    console.log(`Already hashed: ${skippedCount}`);

    // Create default admin if none exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      console.log('\nNo admin user found. Creating default admin...');
      const hash = await bcrypt.hash('admin123', 10);
      const admin = await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: hash,
        role: 'admin'
      });
      console.log(`✓ Created admin user: ${admin.email}`);
      console.log(`  Email: admin@example.com`);
      console.log(`  Password: admin123`);
    } else {
      console.log(`\nAdmin user exists: ${adminExists.email}`);
    }

    await mongoose.disconnect();
    console.log('\nDone!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixUserPasswords();

