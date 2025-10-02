const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Task = require('../models/Task');
const { auth, permit } = require('../middleware/auth');

const { param, body } = require('express-validator');
const { handleValidation } = require('../middleware/validation');

const router = express.Router();
router.use(auth);
router.use(permit('employee','vendor','admin'));

// Employees can view their tasks
router.get('/:id/tasks', [ param('id').isMongoId(), handleValidation ], asyncHandler(async (req, res) => {
  const tasks = await Task.find({ assignedTo: req.params.id });
  res.json(tasks);
}));

// Edit employee profile (admin/vendor can do it; user themselves can do limited edits)
router.put('/:id', [ param('id').isMongoId(), body('name').optional().isLength({ min: 1 }), handleValidation ], asyncHandler(async (req, res) => {
  const id = req.params.id;
  // if vendor is editing, ensure this employee belongs to that vendor
  if (req.user.role === 'vendor') {
    const emp = await User.findById(id);
    if (!emp) return res.status(404).json({ message: 'Not found' });
    if (!emp.vendor || emp.vendor.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });
  }
  // employees can edit their own profile
  if (req.user.role === 'employee' && req.user._id.toString() !== id) return res.status(403).json({ message: 'Forbidden' });
  await User.findByIdAndUpdate(id, req.body);
  res.json({ ok: true });
}));

module.exports = router;
