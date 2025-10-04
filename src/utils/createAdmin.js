require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/crm_db';

async function run() {
  await mongoose.connect(uri);
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  let user = await User.findOne({ email });
  const hash = await bcrypt.hash(password, 10);
  if (user) {
    user.password = hash;
    user.name = user.name || 'Admin';
    user.role = 'admin';
    await user.save();
    console.log('Updated admin:', email);
  } else {
    user = await User.create({ name: 'Admin', email, password: hash, role: 'admin' });
    console.log('Created admin:', email);
  }

  // Print minimal info for Postman use
  console.log('Login with:', { email, password });
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
