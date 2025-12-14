const express = require('express');
const asyncHandler = require('express-async-handler');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth, permit } = require('../middleware/auth');

const { body, param } = require('express-validator');
const { handleValidation } = require('../middleware/validation');

const router = express.Router();

// Public routes (no auth required)
router.get('/public', asyncHandler(async (req, res) => {
  const list = await Lead.find({ status: 'active' });
  res.json(list);
}));

// Protected routes
router.use(auth);

// Routes accessible by admin, vendor, and employee
router.get('/', permit('admin', 'vendor', 'employee'), asyncHandler(async (req, res) => {
  let query = {};
  
  // If user is a vendor, only show their leads
  if (req.user.role === 'vendor') {
    query = { vendor: req.user._id };
  } 
  // If user is an employee, show leads assigned to them
  else if (req.user.role === 'employee') {
    query = { assignedTo: req.user._id };
  }
  
  const list = await Lead.find(query)
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email')
    .populate('vendor', 'name email')
    .sort({ createdAt: -1 });
    
  res.json(list);
}));

// Create new lead (admin/vendor only)
router.post('/', [
  body('name').isLength({ min: 1 }).withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  handleValidation,
  permit('admin', 'vendor')
], asyncHandler(async (req, res) => {
  const leadData = {
    ...req.body,
    createdBy: req.user._id,
    vendor: req.user.role === 'vendor' ? req.user._id : req.body.vendor
  };
  
  const lead = await Lead.create(leadData);
  res.status(201).json(lead);
}));

// Update lead (admin/vendor only)
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid lead ID'),
  handleValidation,
  permit('admin', 'vendor')
], asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  
  if (!lead) {
    return res.status(404).json({ message: 'Lead not found' });
  }
  
  // Prevent changing vendor if not admin
  if (req.user.role === 'vendor' && lead.vendor.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to update this lead' });
  }
  
  const updatedLead = await Lead.findByIdAndUpdate(
    req.params.id, 
    { $set: req.body },
    { new: true, runValidators: true }
  );
  
  res.json(updatedLead);
}));

// Assign lead to employee (admin/vendor only)
router.post('/:id/assign', [
  param('id').isMongoId().withMessage('Invalid lead ID'),
  body('employeeId')
    .isMongoId().withMessage('Invalid employee ID')
    .custom(async (value, { req }) => {
      const employee = await User.findById(value);
      if (!employee || employee.role !== 'employee') {
        throw new Error('Invalid employee');
      }
      // If vendor, check if employee belongs to them
      if (req.user.role === 'vendor') {
        if (!employee.vendor || employee.vendor.toString() !== req.user._id.toString()) {
          throw new Error('Employee does not belong to your organization');
        }
      }
      return true;
    }),
  handleValidation,
  permit('admin', 'vendor')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { employeeId } = req.body;
  
  // Find the lead
  const lead = await Lead.findById(id);
  if (!lead) {
    return res.status(404).json({ message: 'Lead not found' });
  }

  // Check if vendor is trying to assign their own lead
  if (req.user.role === 'vendor' && lead.vendor.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to assign this lead' });
  }

  // Update lead
  lead.assignedTo = employeeId;
  lead.assignedBy = req.user._id;
  lead.assignedAt = new Date();
  lead.status = 'assigned';
  
  await lead.save();

  // Create notification for the employee
  const notification = new Notification({
    user: employeeId,
    title: 'New Lead Assigned',
    message: `You have been assigned a new lead: ${lead.name}`,
    type: 'lead_assigned',
    referenceId: lead._id,
    referenceType: 'Lead',
    read: false
  });
  await notification.save();

  // Populate the response with user details
  const populatedLead = await Lead.findById(lead._id)
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email');

  res.json({
    success: true,
    message: 'Lead assigned successfully',
    data: populatedLead
  });
}));

// Get assignable employees (for dropdown in UI)
router.get('/assignable-employees', 
  permit('admin', 'vendor'),
  asyncHandler(async (req, res) => {
    let query = { role: 'employee' };
    
    // If vendor, only show their employees
    if (req.user.role === 'vendor') {
      query.vendor = req.user._id;
    }

    const employees = await User.find(query)
      .select('_id name email mobileNumber')
      .sort({ name: 1 });

    res.json(employees);
  })
);

// Get leads assigned to current employee
router.get('/my-leads',
  permit('employee'),
  asyncHandler(async (req, res) => {
    const leads = await Lead.find({ assignedTo: req.user._id })
      .populate('assignedBy', 'name email')
      .populate('vendor', 'name email')
      .sort({ assignedAt: -1 });
    
    res.json(leads);
  })
);

// Block/Unblock lead (admin/vendor only)
router.post('/:id/block', [
  param('id').isMongoId().withMessage('Invalid lead ID'),
  body('blocked').isBoolean().withMessage('Blocked must be a boolean'),
  handleValidation,
  permit('admin', 'vendor')
], asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  
  if (!lead) {
    return res.status(404).json({ message: 'Lead not found' });
  }
  
  // Check if vendor owns this lead
  if (req.user.role === 'vendor' && lead.vendor.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to update this lead' });
  }
  
  lead.blocked = req.body.blocked;
  await lead.save();
  
  res.json({ 
    success: true, 
    message: `Lead ${req.body.blocked ? 'blocked' : 'unblocked'} successfully`,
    data: lead
  });
}));

module.exports = router;
