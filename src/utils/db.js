const mongoose = require('mongoose');

/**
 * Connect to MongoDB with simple retry logic.
 * Returns true when connected, false otherwise. Does not call process.exit.
 */
const connectDB = async (options = {}) => {
  const uri = process.env.MONGO_URI || 'mongodb+srv://sagarwankhade425_db_user:3UF7eiwOtD66K8eY@clustercrm.pjmtb7p.mongodb.net/crm_db?retryWrites=true&w=majority&appName=ClusterCRM';
  const maxAttempts = options.maxAttempts || 5;
  const delayMs = options.delayMs || 5000; // 5 seconds

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await mongoose.connect(uri, { /* Mongoose v7 ignores legacy options */ });
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
