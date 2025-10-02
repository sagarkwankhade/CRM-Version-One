const express = require('express');
const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');
const { auth, permit } = require('../middleware/auth');

const { body, param } = require('express-validator');
const { handleValidation } = require('../middleware/validation');

const router = express.Router();
router.use(auth);

// Create task: admin or vendor
router.post('/', [ permit('admin','vendor'), body('title').isLength({ min: 1 }), body('assignedTo').isMongoId(), body('assignedRole').isIn(['vendor','employee']), handleValidation ], asyncHandler(async (req, res) => {
  // If vendor is creating, ensure they are assigning to their own vendor or employees under them
  if (req.user.role === 'vendor') {
    // if assigned to employee, ensure that employee.vendor === req.user._id
    if (req.body.assignedRole === 'employee') {
      const emp = await require('../models/User').findById(req.body.assignedTo);
      if (!emp || !emp.vendor || emp.vendor.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden: cannot assign to this employee' });
    }
  }
  const t = await Task.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(t);
}));

// Edit task (admin only)
router.put('/:id', [ permit('admin'), param('id').isMongoId(), handleValidation ], asyncHandler(async (req, res) => {
  await Task.findByIdAndUpdate(req.params.id, req.body);
  res.json({ ok: true });
}));

// Delete task (admin only)
router.delete('/:id', [ permit('admin'), param('id').isMongoId(), handleValidation ], asyncHandler(async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

// Get tasks (all authenticated)
router.get('/', asyncHandler(async (req, res) => {
  const tasks = await Task.find().populate('assignedTo', 'name email role');
  res.json(tasks);
}));

module.exports = router;
