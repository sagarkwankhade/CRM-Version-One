const express = require('express');
const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth, permit } = require('../middleware/auth');

const { body, param } = require('express-validator');
const { handleValidation } = require('../middleware/validation');

const router = express.Router();
router.use(auth);

router.get('/', permit('admin','vendor'), asyncHandler(async (req, res) => {
  const list = await Notification.find();
  res.json(list);
}));

router.post('/', [ permit('admin'), body('title').isLength({ min: 1 }), body('message').isLength({ min: 1 }), body('audience').isIn(['vendors','employees','custom','all']), handleValidation ], asyncHandler(async (req, res) => {
  const n = await Notification.create(req.body);
  res.status(201).json(n);
}));

router.put('/:id', [ permit('admin'), param('id').isMongoId(), handleValidation ], asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, req.body);
  res.json({ ok: true });
}));

router.delete('/:id', [ permit('admin'), param('id').isMongoId(), handleValidation ], asyncHandler(async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

router.post('/:id/send', [ permit('admin'), param('id').isMongoId(), handleValidation ], asyncHandler(async (req, res) => {
  const n = await Notification.findById(req.params.id);
  if (!n) return res.status(404).json({ message: 'Not found' });
  let recipients = [];
  if (n.audience === 'vendors') recipients = await User.find({ role: 'vendor', blocked: false });
  else if (n.audience === 'employees') recipients = await User.find({ role: 'employee', blocked: false });
  else if (n.audience === 'custom') recipients = await User.find({ _id: { $in: n.customList } });
  else recipients = await User.find({ blocked: false });
  res.json({ recipients: recipients.length });
}));

module.exports = router;
