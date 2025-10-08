const express = require('express');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Task = require('../models/Task');
const Lead = require('../models/Lead');
const Notification = require('../models/Notification');
const { auth, permit } = require('../middleware/auth');
const { body, param } = require('express-validator');
const { handleValidation } = require('../middleware/validation');

const router = express.Router();

// Admin-only routes
router.use(auth);
router.use(permit('admin'));

// Dashboard counts
router.get('/dashboard', asyncHandler(async (req, res) => {
  const vendors = await User.countDocuments({ role: 'vendor' });
  const employees = await User.countDocuments({ role: 'employee' });
  const leads = await Lead.countDocuments();
  const notifications = await Notification.countDocuments();
  res.json({ vendors, employees, leads, notifications });
}));

/* ==============================
        VENDORS MANAGEMENT
================================*/
router.get('/vendors', asyncHandler(async (req, res) => {
  const list = await User.find({ role: 'vendor' })
    .select('name role username mobileNumber whatsappNumber email businessName businessCity');
  res.json(list);
}));

router.get('/vendors/:id', [
  param('id').isMongoId().withMessage('Invalid vendor ID'),
  handleValidation
], asyncHandler(async (req, res) => {
  const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' })
    .select('name role username mobileNumber whatsappNumber email businessName businessCity');
  if (!vendor) {
    return res.status(404).json({ message: 'Vendor not found' });
  }
  res.json(vendor);
}));

router.post('/vendors', [
  body('name').isLength({ min: 1 }),
  body('role').isIn(['vendor']),
  body('username').isLength({ min: 3 }),
  body('mobileNumber').matches(/^[0-9]{10}$/).withMessage('Invalid mobile number'),
  body('whatsappNumber').matches(/^[0-9]{10}$/).withMessage('Invalid WhatsApp number'),
  body('email').isEmail(),
  body('businessName').isLength({ min: 2 }),
  body('businessCity').isLength({ min: 2 }),
  handleValidation
], asyncHandler(async (req, res) => {
  const { name, role, username, mobileNumber, whatsappNumber, email, businessName, businessCity, password } = req.body;
  const hash = await bcrypt.hash(password || 'vendor123', 10);

  const user = await User.create({
    name,
    role,
    username,
    mobileNumber,
    whatsappNumber,
    email,
    businessName,
    businessCity,
    password: hash
  });

  res.status(201).json(user);
}));

router.put('/vendors/:id', [
  param('id').isMongoId(),
  handleValidation
], asyncHandler(async (req, res) => {
  const updateData = (({ name, role, username, mobileNumber, whatsappNumber, email, businessName, businessCity }) =>
    ({ name, role, username, mobileNumber, whatsappNumber, email, businessName, businessCity }))(req.body);

  await User.findByIdAndUpdate(req.params.id, updateData);
  res.json({ ok: true, message: 'Vendor updated successfully' });
}));

router.delete('/vendors/:id', [
  param('id').isMongoId(),
  handleValidation
], asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true, message: 'Vendor deleted successfully' });
}));

/* ==============================
       EMPLOYEES MANAGEMENT
================================*/
router.get('/employees', asyncHandler(async (req, res) => {
  const list = await User.find({ role: 'employee' })
    .select('name role username mobileNumber whatsappNumber email businessName businessCity');
  res.json(list);
}));

router.post('/employees', [
  body('name').isLength({ min: 1 }),
  body('role').isIn(['employee']),
  body('username').isLength({ min: 3 }),
  body('mobileNumber').matches(/^[0-9]{10}$/),
  body('whatsappNumber').matches(/^[0-9]{10}$/),
  body('email').isEmail(),
  body('businessName').isLength({ min: 2 }),
  body('businessCity').isLength({ min: 2 }),
  handleValidation
], asyncHandler(async (req, res) => {
  const { name, role, username, mobileNumber, whatsappNumber, email, businessName, businessCity, password } = req.body;
  const hash = await bcrypt.hash(password || 'employee123', 10);

  const user = await User.create({
    name,
    role,
    username,
    mobileNumber,
    whatsappNumber,
    email,
    businessName,
    businessCity,
    password: hash
  });

  res.status(201).json(user);
}));

router.put('/employees/:id', [
  param('id').isMongoId(),
  handleValidation
], asyncHandler(async (req, res) => {
  const updateData = (({ name, role, username, mobileNumber, whatsappNumber, email, businessName, businessCity }) =>
    ({ name, role, username, mobileNumber, whatsappNumber, email, businessName, businessCity }))(req.body);

  await User.findByIdAndUpdate(req.params.id, updateData);
  res.json({ ok: true, message: 'Employee updated successfully' });
}));

router.delete('/employees/:id', [
  param('id').isMongoId(),
  handleValidation
], asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true, message: 'Employee deleted successfully' });
}));

/* ==============================
          ADMIN PROFILE
================================*/
router.get('/me', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('name role username mobileNumber whatsappNumber email businessName businessCity');
  res.json(user);
}));

router.put('/me', [
  body('name').isLength({ min: 2 }),
  body('role').isIn(['admin']),
  body('username').isLength({ min: 3 }),
  body('mobileNumber').matches(/^[0-9]{10}$/),
  body('whatsappNumber').matches(/^[0-9]{10}$/),
  body('email').isEmail(),
  body('businessName').isLength({ min: 2 }),
  body('businessCity').isLength({ min: 2 }),
  handleValidation
], asyncHandler(async (req, res) => {
  const updateData = (({ name, role, username, mobileNumber, whatsappNumber, email, businessName, businessCity }) =>
    ({ name, role, username, mobileNumber, whatsappNumber, email, businessName, businessCity }))(req.body);

  await User.findByIdAndUpdate(req.user._id, updateData);
  res.json({ ok: true, message: 'Profile updated successfully' });
}));

module.exports = router;
