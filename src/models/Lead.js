const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  status: { type: String, default: 'new' },
  blocked: { type: Boolean, default: false },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
