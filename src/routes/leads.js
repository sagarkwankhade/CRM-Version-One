const express = require('express');
const asyncHandler = require('express-async-handler');
const Lead = require('../models/Lead');
const { auth, permit } = require('../middleware/auth');

const { body, param } = require('express-validator');
const { handleValidation } = require('../middleware/validation');

const router = express.Router();
router.use(auth);
router.use(permit('admin','vendor'));

router.post('/', [ body('name').isLength({ min: 1 }), body('email').optional().isEmail(), handleValidation ], asyncHandler(async (req, res) => {
  const l = await Lead.create(req.body);
  res.status(201).json(l);
}));

router.get('/', asyncHandler(async (req, res) => {
  const list = await Lead.find();
  res.json(list);
}));

router.put('/:id', [ param('id').isMongoId(), handleValidation ], asyncHandler(async (req, res) => {
  await Lead.findByIdAndUpdate(req.params.id, req.body);
  res.json({ ok: true });
}));

router.post('/:id/block', [ param('id').isMongoId(), handleValidation ], asyncHandler(async (req, res) => {
  await Lead.findByIdAndUpdate(req.params.id, { blocked: true });
  res.json({ ok: true });
}));

module.exports = router;
