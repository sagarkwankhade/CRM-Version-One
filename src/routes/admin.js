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

// Admin can manage vendors
router.get('/vendors', asyncHandler(async (req, res) => {
  const vendors = await User.find({ role: 'vendor' }).select('-password');
  
  // Map vendors to include all fields properly
  // Check both top-level fields and profile object for backward compatibility
  const formattedVendors = vendors.map(vendor => {
    // Helper to safely get nested profile values
    const getProfileValue = (key, altKeys = []) => {
      if (vendor[key]) return vendor[key];
      if (vendor.profile && typeof vendor.profile === 'object') {
        if (vendor.profile[key]) return vendor.profile[key];
        for (const altKey of altKeys) {
          if (vendor.profile[altKey]) return vendor.profile[altKey];
        }
      }
      return null;
    };
    
    return {
      _id: vendor._id,
      name: vendor.name || null,
      username: getProfileValue('username'),
      email: vendor.email || null,
      mobileNumber: getProfileValue('mobileNumber', ['phone', 'mobile']),
      whatsappNumber: getProfileValue('whatsappNumber'),
      businessName: getProfileValue('businessName'),
      businessAddress: getProfileValue('businessAddress', ['address']),
      businessCity: getProfileValue('businessCity', ['city']),
      role: vendor.role || null,
      blocked: vendor.blocked || false,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt
    };
  });
  
  res.json(formattedVendors);
}));

// Get vendor by ID
router.get('/vendors/:id', [
  param('id').isMongoId().withMessage('Invalid vendor ID'),
  handleValidation
], asyncHandler(async (req, res) => {
  const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' }).select('-password');
  if (!vendor) {
    return res.status(404).json({ message: 'Vendor not found' });
  }

  // Helper to safely get nested profile values
  const getProfileValue = (key, altKeys = []) => {
    if (vendor[key]) return vendor[key];
    if (vendor.profile && typeof vendor.profile === 'object') {
      if (vendor.profile[key]) return vendor.profile[key];
      for (const altKey of altKeys) {
        if (vendor.profile[altKey]) return vendor.profile[altKey];
      }
    }
    return null;
  };

  // Map vendor document to include all fields from both vendor object and profile
  const response = {
    _id: vendor._id,
    name: vendor.name || null,
    username: getProfileValue('username'),
    email: vendor.email || null,
    mobileNumber: getProfileValue('mobileNumber', ['phone', 'mobile']),
    whatsappNumber: getProfileValue('whatsappNumber'),
    businessName: getProfileValue('businessName'),
    businessAddress: getProfileValue('businessAddress', ['address']),
    businessCity: getProfileValue('businessCity', ['city']),
    role: vendor.role || null,
    blocked: vendor.blocked || false,
    createdAt: vendor.createdAt,
    updatedAt: vendor.updatedAt
  };

  res.json(response);
}));

router.post('/vendors', [ 
  body('name').isLength({ min: 1 }), 
  body('email').isEmail(), 
  body('password').optional().isLength({ min: 6 }),
  body('username').optional().isLength({ min: 3 }),
  body('mobileNumber').optional().matches(/^[0-9]{10}$/),
  body('whatsappNumber').optional().matches(/^[0-9]{10}$/),
  body('businessName').optional().isLength({ min: 2 }),
  body('businessAddress').optional().isLength({ min: 5 }),
  body('businessCity').optional().isLength({ min: 2 }),
  handleValidation 
], asyncHandler(async (req, res) => {
  const { 
    name, 
    email, 
    password, 
    username, 
    mobileNumber, 
    whatsappNumber, 
    businessName, 
    businessAddress, 
    businessCity 
  } = req.body;
  
  const hash = await bcrypt.hash(password || 'vendor123', 10);
  
  const userData = {
    name,
    email,
    password: hash,
    role: 'vendor',
    createdBy: req.user._id
  };
  
  // Add optional fields if provided
  if (username) userData.username = username;
  if (mobileNumber) userData.mobileNumber = mobileNumber;
  if (whatsappNumber) userData.whatsappNumber = whatsappNumber;
  if (businessName) userData.businessName = businessName;
  if (businessAddress) userData.businessAddress = businessAddress;
  if (businessCity) userData.businessCity = businessCity;
  
  const user = await User.create(userData);
  
  // Return formatted response without password
  const response = {
    _id: user._id,
    name: user.name,
    username: user.username || null,
    email: user.email,
    mobileNumber: user.mobileNumber || null,
    whatsappNumber: user.whatsappNumber || null,
    businessName: user.businessName || null,
    businessAddress: user.businessAddress || null,
    businessCity: user.businessCity || null,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
  
  res.status(201).json(response);
}));

router.put('/vendors/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  const { password, ...updateData } = req.body;
  
  // Don't allow password updates through this endpoint (use separate endpoint if needed)
  // Update the vendor
  const updatedVendor = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
  
  if (!updatedVendor) {
    return res.status(404).json({ message: 'Vendor not found' });
  }
  
  // Return formatted response with all fields
  const response = {
    _id: updatedVendor._id,
    name: updatedVendor.name,
    username: updatedVendor.username || null,
    email: updatedVendor.email,
    mobileNumber: updatedVendor.mobileNumber || null,
    whatsappNumber: updatedVendor.whatsappNumber || null,
    businessName: updatedVendor.businessName || null,
    businessAddress: updatedVendor.businessAddress || null,
    businessCity: updatedVendor.businessCity || null,
    role: updatedVendor.role,
    blocked: updatedVendor.blocked || false,
    createdAt: updatedVendor.createdAt,
    updatedAt: updatedVendor.updatedAt
  };
  
  res.json({ ok: true, vendor: response });
}));

router.delete('/vendors/:id', [ param('id').isMongoId(), handleValidation ], asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

router.post('/vendors/:id/block', [ param('id').isMongoId(), handleValidation ], asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { blocked: true });
  res.json({ ok: true });
}));
router.post('/vendors/:id/unblock', [ param('id').isMongoId(), handleValidation ], asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { blocked: false });
  res.json({ ok: true });
}));
router.post('/vendors/:id/unblock', asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { blocked: false });
  res.json({ ok: true });
}));

// Admin can manage employees
router.get('/employees', asyncHandler(async (req, res) => {
  const list = await User.find({ role: 'employee' });
  res.json(list);
}));

router.post('/employees', [ body('name').isLength({ min: 1 }), body('email').isEmail(), body('password').optional().isLength({ min: 6 }), handleValidation ], asyncHandler(async (req, res) => {
  const { name, email, password, vendor } = req.body;
  // If admin creating without vendor specified, leave vendor null
  const hash = await bcrypt.hash(password || 'employee123', 10);
  const user = await User.create({ name, email, password: hash, role: 'employee', createdBy: req.user._id, vendor: vendor || null });
  res.status(201).json(user);
}));

router.put('/employees/:id', asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, req.body);
  res.json({ ok: true });
}));

router.delete('/employees/:id', [ param('id').isMongoId(), handleValidation ], asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

router.post('/employees/:id/block', [ param('id').isMongoId(), handleValidation ], asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { blocked: true });
  res.json({ ok: true });
}));
router.post('/employees/:id/unblock', [ param('id').isMongoId(), handleValidation ], asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { blocked: false });
  res.json({ ok: true });
}));

// Tasks overview
router.get('/tasks', asyncHandler(async (req, res) => {
  const tasks = await Task.find().populate('assignedTo', 'name email role');
  res.json(tasks);
}));

// Leads management
router.get('/leads', asyncHandler(async (req, res) => {
  const leads = await Lead.find();
  res.json(leads);
}));
router.put('/leads/:id', [ param('id').isMongoId(), handleValidation ], asyncHandler(async (req, res) => {
  await Lead.findByIdAndUpdate(req.params.id, req.body);
  res.json({ ok: true });
}));
router.post('/leads/:id/block', [ param('id').isMongoId(), handleValidation ], asyncHandler(async (req, res) => {
  await Lead.findByIdAndUpdate(req.params.id, { blocked: true });
  res.json({ ok: true });
}));

// Notifications
router.get('/notifications', asyncHandler(async (req, res) => {
  const list = await Notification.find();
  res.json(list);
}));
router.post('/notifications', [ body('title').isLength({ min: 1 }), body('message').isLength({ min: 1 }), body('audience').isIn(['vendors','employees','custom','all']), handleValidation ], asyncHandler(async (req, res) => {
  const n = await Notification.create(req.body);
  res.status(201).json(n);
}));
router.put('/notifications/:id', [ param('id').isMongoId(), body('title').optional().isLength({ min: 1 }), handleValidation ], asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, req.body);
  res.json({ ok: true });
}));
router.delete('/notifications/:id', [ param('id').isMongoId(), handleValidation ], asyncHandler(async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

// Bulk send: here we only record the notification and optionally return list of recipients
router.post('/notifications/:id/send', asyncHandler(async (req, res) => {
  const n = await Notification.findById(req.params.id);
  if (!n) return res.status(404).json({ message: 'Not found' });
  let recipients = [];
  if (n.audience === 'vendors') recipients = await User.find({ role: 'vendor', blocked: false });
  else if (n.audience === 'employees') recipients = await User.find({ role: 'employee', blocked: false });
  else if (n.audience === 'custom') recipients = await User.find({ _id: { $in: n.customList } });
  else recipients = await User.find({ blocked: false });
  // In a real system we'd queue/send notifications. Return recipients count for now.
  res.json({ recipients: recipients.length });
}));

// Admin profile
router.get('/me', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  // Return only the specified fields for admin personal information
  const { 
    name, 
    username,
    email,
    role,
    profile: { 
      phone, 
      whatsappNumber, 
      businessName, 
      address,
      linkedinUrl,
      instagramUrl 
    } = {} 
  } = user;
  
  res.json({
    name,
    username,
    email,
    role,
    profile: {
      phone,
      whatsappNumber,
      businessName,
      address,
      linkedinUrl,
      instagramUrl
    }
  });
}));

router.put('/me', [
  // Validation for required fields
  body('name').isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Must be a valid email'),
  body('profile.phone').notEmpty().matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/).withMessage('Invalid phone number'),
  body('profile.whatsappNumber').notEmpty().matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/).withMessage('Invalid WhatsApp number'),
  body('profile.businessName').notEmpty().isLength({ min: 2 }).withMessage('Business name must be at least 2 characters'),
  body('profile.address').notEmpty().isLength({ min: 5 }).withMessage('Address must be at least 5 characters'),
  body('profile.linkedinUrl').notEmpty().isURL().withMessage('Must be a valid LinkedIn URL'),
  body('profile.instagramUrl').notEmpty().isURL().withMessage('Must be a valid Instagram URL'),
  handleValidation
], asyncHandler(async (req, res) => {
  const { name, username, email, profile } = req.body;
  
  // Only allow specified fields
  const updateData = {
    name,
    username,
    email,
    profile: {
      phone: profile.phone,
      whatsappNumber: profile.whatsappNumber,
      businessName: profile.businessName,
      address: profile.address,
      linkedinUrl: profile.linkedinUrl,
      instagramUrl: profile.instagramUrl
    }
  };

  await User.findByIdAndUpdate(req.user._id, updateData);
  res.json({ ok: true, message: 'Profile updated successfully' });
}));

module.exports = router;
