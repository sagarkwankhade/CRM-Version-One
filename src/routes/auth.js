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
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 }).trim()
], handleValidation, asyncHandler(async (req, res) => {
  let { email, password } = req.body;

  // Trim whitespace from email and password
  email = email ? email.trim().toLowerCase() : '';
  password = password ? password.trim() : '';

  // Debugging: Log received email (without password for security)
  console.log('Login attempt with email:', email);
  console.log('Password length:', password ? password.length : 0);

  // If DB is not connected, return a quick 503 instead of timing out
  if (mongoose.connection.readyState !== 1) {
    console.error('Database not connected. Connection state:', mongoose.connection.readyState);
    return res.status(503).json({ message: 'Database not connected' });
  }

  // Find user by email (case-insensitive search using regex)
  // Escape special regex characters in email
  const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const user = await User.findOne({ email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } });

  // Debugging: Log user lookup result (without sensitive data)
  if (user) {
    console.log('User found:', { id: user._id, email: user.email, role: user.role });
  } else {
    console.log('User not found for email:', email);
  }

  if (!user) {
    console.error('Invalid credentials: User not found for email:', email);
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Check if user is blocked
  if (user.blocked) {
    console.error('Login attempt blocked for user:', email);
    return res.status(403).json({ message: 'Account is blocked' });
  }

  // Compare password
  const ok = await bcrypt.compare(password, user.password);

  // Debugging: Log password comparison result
  console.log('Password comparison result:', ok);

  if (!ok) {
    console.error('Invalid credentials: Password mismatch for email:', email);
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
