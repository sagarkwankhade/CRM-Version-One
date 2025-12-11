const express = require('express');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

const { auth, permit } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validation');
const router = express.Router();

router.post('/login', [
  body('email').isEmail(),
  body('password').isLength({ min: 1 })
], handleValidation, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Debugging: Log received email
  console.log('Login attempt with email:', email);

  // If DB is not connected, return a quick 503 instead of timing out
  if (mongoose.connection.readyState !== 1) {
    console.error('Database not connected');
    return res.status(503).json({ message: 'Database not connected' });
  }

  const user = await User.findOne({ email });

  // Debugging: Log user lookup result
  console.log('User lookup result:', user);

  if (!user) {
    console.error('Invalid credentials: User not found');
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password, user.password);

  // Debugging: Log password comparison result
  console.log('Password comparison result:', ok);

  if (!ok) {
    console.error('Invalid credentials: Password mismatch');
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'change_this_secret', { expiresIn: '7d' });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}));

// register: only admin/vendor can create users. This endpoint requires auth and permit.
router.post('/register', auth, permit('admin','vendor'), [
  body('name').isLength({ min: 1 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['vendor','employee'])
], handleValidation, asyncHandler(async (req, res) => {
  const { name, email, password, role, vendor } = req.body;
  // prevent vendors from creating vendors (optional) — vendors should create only employees
  if (req.user.role === 'vendor' && role === 'vendor') return res.status(403).json({ message: 'Vendors cannot create vendors' });
  // prevent creation of admins anywhere
  if (role === 'admin') return res.status(403).json({ message: 'Cannot create admin via this endpoint' });
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email exists' });
  const hash = await bcrypt.hash(password, 10);
  const data = { name, email, password: hash, role, createdBy: req.user._id };
  if (role === 'employee') data.vendor = req.user.role === 'vendor' ? req.user._id : vendor;
  const user = await User.create(data);
  res.status(201).json({ id: user._id });
}));

module.exports = router;
