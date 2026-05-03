const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The user who performed the action
  action: { type: String, required: true }, // e.g., 'SECURITY_VIOLATION', 'USER_REMOVED'
  role: { type: String }, // Role of the user at the time
  targetId: { type: mongoose.Schema.Types.ObjectId }, // ID of the request, user, etc.
  details: { type: String },
  ip: { type: String } // IP address for forensic tracking
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
