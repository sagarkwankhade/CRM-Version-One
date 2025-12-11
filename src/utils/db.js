const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Enable mongoose debug mode
mongoose.set('debug', true);

/**
 * Connect to MongoDB with simple retry logic.
 * Returns true when connected, false otherwise. Does not call process.exit.
 */
const connect = async (options = {}) => {
  // Prefer MONGO_URI from environment. Default to local MongoDB if not set.
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/crm_db';
  const maxAttempts = options.maxAttempts || 5;
  const delayMs = options.delayMs || 5000; // 5 seconds

  // Mask password when logging URI
  try {
    const masked = uri.replace(/:[^:@]*@/, ':****@');
    console.log('Attempting MongoDB connect to:', masked);
  } catch (e) {
    console.error('Error masking URI:', e.message);
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    console.error('Invalid MongoDB URI scheme. Ensure it starts with "mongodb://" or "mongodb+srv://".');
    return false;
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000, // 30 seconds
        connectTimeoutMS: 30000,        // 30 seconds
      });
      console.log('MongoDB connected');
      return true;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt} failed:`);
      console.error(err && err.message ? err.message : err);
      if (attempt < maxAttempts) {
        console.log(`Retrying in ${delayMs / 1000}s... (attempt ${attempt + 1}/${maxAttempts})`);
        // eslint-disable-next-line no-await-in-loop
        await new Promise(res => setTimeout(res, delayMs));
      } else {
        console.error('All MongoDB connection attempts failed. Continuing without DB connection.');
        return false;
      }
    }
  }
};

/**
 * Logs the details of a login attempt.
 * @param {string} email - The email used for the login attempt.
 * @param {Object|null} user - The user object if found, null otherwise.
 * @param {boolean} passwordMatch - Result of the password comparison.
 */
function logLoginAttempt(email, user, passwordMatch) {
  console.log(`Login attempt with email: ${email}`);
  console.log(`User lookup result: ${user ? JSON.stringify(user) : 'null'}`);
  console.log(`Password comparison result: ${passwordMatch}`);
}

// Utility function to ensure a default user exists in the database.
const ensureDefaultUser = async () => {
  const email = 'admin@example.com';
  const password = 'admin123';

  try {
    // Use case-insensitive email search
    const existingUser = await User.findOne({ email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    
    if (existingUser) {
      // Check if password is hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      const isHashed = existingUser.password && (existingUser.password.startsWith('$2a$') || existingUser.password.startsWith('$2b$') || existingUser.password.startsWith('$2y$'));
      
      if (!isHashed) {
        // Re-hash the password if it's stored in plain text
        console.log('Found user with plain text password, updating to hashed password...');
        const hash = await bcrypt.hash(password, 10);
        existingUser.password = hash;
        await existingUser.save();
        console.log('Updated user password to hashed format:', email);
      } else {
        console.log('Default user already exists with hashed password:', email);
      }
      return;
    }

    // Create new user with hashed password
    const hash = await bcrypt.hash(password, 10);
    const user = new User({
      name: 'Admin',
      email: email.toLowerCase(), // Store email in lowercase
      password: hash,
      role: 'admin'
    });
    await user.save();
    console.log('Default user created:', email);
  } catch (error) {
    console.error('Error ensuring default user:', error.message);
  }
};

module.exports = { connect, ensureDefaultUser };

