const mongoose = require('mongoose');

/**
 * Connect to MongoDB with simple retry logic.
 * Returns true when connected, false otherwise. Does not call process.exit.
 */
const connectDB = async (options = {}) => {
  // Prefer MONGO_URI from environment. Default to the requested connection string placeholder.
  const uri = process.env.MONGO_URI || 'mongodb+srv://<db_username>:<db_password>@crm2.mknmmxj.mongodb.net/?appName=crm2';
  const maxAttempts = options.maxAttempts || 5;
  const delayMs = options.delayMs || 5000; // 5 seconds

  // Mask password when logging URI
  try {
    const masked = uri.replace(/:[^:@]*@/, ':****@');
    console.log('Attempting MongoDB connect to:', masked);
  } catch (e) {
    // ignore
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: options.serverSelectionTimeoutMS || 10000,
        connectTimeoutMS: options.connectTimeoutMS || 10000,
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
