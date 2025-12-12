require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const uri = process.env.MONGO_URI || 'mongodb+srv://sagarwankhade425_db_user:VEwqfP8kKL060xME@crm12.yaa8wom.mongodb.net/?appName=crm12';

async function listUsers() {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });
    console.log('Connected to MongoDB\n');

    const users = await User.find({}).select('name email role blocked createdAt');
    
    if (users.length === 0) {
      console.log('No users found in database.');
      console.log('\nTo create an admin user, run:');
      console.log('  node src/utils/createAdmin.js');
    } else {
      console.log(`Found ${users.length} user(s):\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Blocked: ${user.blocked}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

listUsers();

