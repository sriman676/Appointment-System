const mongoose = require('mongoose');

const BlockedDaySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Staff or Counselor
  date: { type: Date, required: true },
  reason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('BlockedDay', BlockedDaySchema);
