require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/crm_db';

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
