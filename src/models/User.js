const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin','vendor','employee','lead'], required: true },
  blocked: { type: Boolean, default: false },
  profile: { type: mongoose.Schema.Types.Mixed },
  // who created this user (admin or vendor)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // for employees, link to the vendor they belong to
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
