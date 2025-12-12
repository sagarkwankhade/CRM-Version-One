require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const uri = process.env.MONGO_URI || 'mongodb+srv://sagarwankhade425_db_user:VEwqfP8kKL060xME@crm12.yaa8wom.mongodb.net/?appName=crm12';

async function run() {
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const exists = await User.findOne({ role: 'admin' });
  if (exists) {
    console.log('Admin already exists', exists.email);
    process.exit(0);
  }
  const hash = await bcrypt.hash('admin123', 10);
  const admin = await User.create({ name: 'Admin', email: 'admin@example.com', password: hash, role: 'admin' });
  console.log('Created admin', admin.email);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
