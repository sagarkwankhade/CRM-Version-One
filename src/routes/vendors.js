const express = require('express');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Task = require('../models/Task');
const { auth, permit } = require('../middleware/auth');

const router = express.Router();
router.use(auth);
router.use(permit('vendor','admin'));

// Vendor can create employees
const { body, param } = require('express-validator');
const { handleValidation } = require('../middleware/validation');

router.post('/:vendorId/employees', [ param('vendorId').isMongoId(), body('name').isLength({ min: 1 }), body('email').isEmail(), body('password').optional().isLength({ min: 6 }), handleValidation ], asyncHandler(async (req, res) => {
  // vendorId path param must match authenticated vendor unless admin
  const { name, email, password } = req.body;
  const vendorId = req.params.vendorId;
  if (req.user.role === 'vendor' && req.user._id.toString() !== vendorId) {
    return res.status(403).json({ message: 'Forbidden: vendor mismatch' });
  }
  const hash = await bcrypt.hash(password || 'employee123', 10);
  const user = await User.create({ name, email, password: hash, role: 'employee', createdBy: req.user._id, vendor: vendorId });
  res.status(201).json(user);
}));

// Vendor can assign task to vendor (self) or employees by id
router.post('/:vendorId/tasks', [ param('vendorId').isMongoId(), body('title').isLength({ min: 1 }), body('assignedTo').isMongoId(), body('assignedRole').isIn(['vendor','employee']), handleValidation ], asyncHandler(async (req, res) => {
  const { title, description, dueDate, priority, assignedTo, assignedRole } = req.body;
  const vendorId = req.params.vendorId;
  if (req.user.role === 'vendor' && req.user._id.toString() !== vendorId) return res.status(403).json({ message: 'Forbidden: vendor mismatch' });
  const t = await Task.create({ title, description, dueDate, priority, assignedTo, assignedRole, createdBy: req.user._id });
  res.status(201).json(t);
}));

module.exports = router;
