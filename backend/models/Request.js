const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  counselorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  staffId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  categoryId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  requestType: { type: String, enum: ['Counseling', 'Staff Appointment'], required: true },
  subject:     { type: String, required: true },
  meetingMode: { type: String, enum: ['Online', 'In-Person'], required: true },
  preferredDate: { type: Date, required: true },
  preferredTime: { type: String, required: true },
  duration:    { type: Number, default: 30 },
  attachments: [{ type: String }],
  priority:    { type: String, enum: ['Normal', 'High', 'Urgent'], default: 'Normal' },
  status: {
    type: String,
    enum: ['Pending', 'Escalated', 'Accepted', 'Rejected', 'Expired', 'Cancelled', 'RescheduleRequested'],
    default: 'Pending'
  },
  rejectionReason: { type: String },
  // Auto-set to 48h from now at creation time
  expiresAt: { type: Date, default: () => new Date(Date.now() + 48 * 60 * 60 * 1000) }
}, { timestamps: true });

// Indexes for efficient user-scoped queries
RequestSchema.index({ studentId: 1, status: 1 });
RequestSchema.index({ counselorId: 1, status: 1 });
RequestSchema.index({ staffId: 1, status: 1 });
RequestSchema.index({ categoryId: 1, counselorId: 1 });

module.exports = mongoose.model('Request', RequestSchema);
