const express = require('express');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Task = require('../models/Task');
const { auth, permit } = require('../middleware/auth');
const { body, param } = require('express-validator');
const { handleValidation } = require('../middleware/validation');

const router = express.Router();
router.use(auth);
router.use(permit('vendor', 'admin'));

// ===============================
// 🧩 Edit Vendor Personal Information
// ===============================
router.put('/:vendorId/edit-info', [
  param('vendorId').isMongoId().withMessage('Invalid vendor ID'),

  body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('role').optional().isIn(['vendor', 'employee']).withMessage('Invalid role'),
  body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('mobileNumber').optional().matches(/^[0-9]{10}$/).withMessage('Invalid mobile number'),
  body('whatsappNumber').optional().matches(/^[0-9]{10}$/).withMessage('Invalid WhatsApp number'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('businessName').optional().isLength({ min: 2 }).withMessage('Business name must be at least 2 characters'),
  body('businessAddress').optional().isLength({ min: 5 }).withMessage('Business address must be at least 5 characters'),
  body('businessCity').optional().isLength({ min: 2 }).withMessage('Business city must be at least 2 characters'),
  body('block').optional().isBoolean().withMessage('Block must be true or false'),
  handleValidation
], asyncHandler(async (req, res) => {
  const vendorId = req.params.vendorId;
  
  // Vendor can only edit their own info
  if (req.user.role === 'vendor' && req.user._id.toString() !== vendorId) {
    return res.status(403).json({ message: 'Forbidden: vendor mismatch' });
  }

  const vendor = await User.findOne({ _id: vendorId, role: 'vendor' });
  if (!vendor) {
    return res.status(404).json({ message: 'Vendor not found' });
  }

  const {
    name,
    role,
    username,
    mobileNumber,
    whatsappNumber,
    email,
    businessName,
    businessAddress,
    businessCity,
    block
  } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (role) updateData.role = role;
  if (username) updateData.username = username;
  if (mobileNumber) updateData.mobileNumber = mobileNumber;
  if (whatsappNumber) updateData.whatsappNumber = whatsappNumber;
  if (email) updateData.email = email;
  if (businessName) updateData.businessName = businessName;
  if (businessAddress) updateData.businessAddress = businessAddress;
  if (businessCity) updateData.businessCity = businessCity;
  if (block !== undefined) updateData.blocked = block;

  await User.findByIdAndUpdate(vendorId, updateData, { new: true });

  res.json({
    ok: true,
    message: 'Vendor personal information updated successfully'
  });
}));

// ===============================
// 👷 Vendor can create employees
// ===============================
router.post('/:vendorId/employees', [
  param('vendorId').isMongoId(),
  body('name').isLength({ min: 1 }),
  body('email').isEmail(),
  body('password').optional().isLength({ min: 6 }),
  body('username').optional().isLength({ min: 3 }),
  body('mobileNumber').optional().matches(/^[0-9]{10}$/),
  body('aadharNumber').optional().matches(/^[0-9]{12}$/),
  body('city').optional().isLength({ min: 2 }),
  handleValidation
], asyncHandler(async (req, res) => {
  const { name, email, password, username, mobileNumber, aadharNumber, city } = req.body;
  const vendorId = req.params.vendorId;

  if (req.user.role === 'vendor' && req.user._id.toString() !== vendorId) {
    return res.status(403).json({ message: 'Forbidden: vendor mismatch' });
  }

  const hash = await bcrypt.hash(password || 'employee123', 10);
  const userData = {
    name,
    email,
    password: hash,
    role: 'employee',
    createdBy: req.user._id,
    vendor: vendorId
  };

  // Add optional fields if provided
  if (username) userData.username = username;
  if (mobileNumber) userData.mobileNumber = mobileNumber;
  if (aadharNumber) userData.aadharNumber = aadharNumber;
  if (city) userData.city = city;

  const user = await User.create(userData);

  // Helper to get field value
  const getFieldValue = (emp, key) => emp[key] || null;

  // Return formatted response without password
  const response = {
    _id: user._id.toString(),
    name: user.name || null,
    username: getFieldValue(user, 'username'),
    email: user.email || null,
    mobileNumber: getFieldValue(user, 'mobileNumber'),
    aadharNumber: getFieldValue(user, 'aadharNumber'),
    city: getFieldValue(user, 'city'),
    role: user.role || null,
    blocked: user.blocked || false,
    vendor: user.vendor || null,
    createdBy: user.createdBy || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };

  res.status(201).json(response);
}));

// ===============================
// 📋 Vendor can assign tasks
// ===============================
router.post('/:vendorId/tasks', [
  param('vendorId').isMongoId(),
  body('title').isLength({ min: 1 }),
  body('assignedTo').isMongoId(),
  body('assignedRole').isIn(['vendor', 'employee']),
  handleValidation
], asyncHandler(async (req, res) => {
  const { title, description, dueDate, priority, assignedTo, assignedRole } = req.body;
  const vendorId = req.params.vendorId;

  if (req.user.role === 'vendor' && req.user._id.toString() !== vendorId) {
    return res.status(403).json({ message: 'Forbidden: vendor mismatch' });
  }

  const t = await Task.create({
    title,
    description,
    dueDate,
    priority,
    assignedTo,
    assignedRole,
    createdBy: req.user._id
  });

  res.status(201).json(t);
}));

module.exports = router;
