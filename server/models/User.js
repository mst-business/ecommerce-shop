const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);


