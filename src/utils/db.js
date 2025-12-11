const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Enable mongoose debug mode
mongoose.set('debug', true);

/**
 * Connect to MongoDB with simple retry logic.
 * Returns true when connected, false otherwise. Does not call process.exit.
 */
const connectDB = async (options = {}) => {
  // Prefer MONGO_URI from environment. Default to the requested connection string placeholder.
  const uri = process.env.MONGO_URI || 'mongodb+srv://sagarwankhade425_db_user:VEwqfP8kKL060xME@crm12.yaa8wom.mongodb.net/?appName=crm12';
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

module.exports = connectDB;

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

// Example usage
logLoginAttempt('test@example.com', { id: 1, email: 'test@example.com' }, true);

// Password hashing example
(async () => {
  const newPassword = 'new_password';
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  console.log('Hashed password:', hashedPassword);
})();

// Removed invalid MongoDB shell command
// If you need to insert a user, use Mongoose methods like this:
// const user = new User({
//   name: "Test User",
//   email: "test@example.com",
//   password: "<hashed_password>",
//   role: "employee"
// });
// await user.save();
// console.log("User inserted:", user);

