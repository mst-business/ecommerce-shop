const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Counter', CounterSchema);


