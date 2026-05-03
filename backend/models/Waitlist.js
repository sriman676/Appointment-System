const mongoose = require('mongoose');

const WaitlistSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  counselorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  preferredDate: { type: Date },
  preferredTime: { type: String },
  status: { type: String, enum: ['Waiting', 'Notified', 'Expired'], default: 'Waiting' }
}, { timestamps: true });

module.exports = mongoose.model('Waitlist', WaitlistSchema);
