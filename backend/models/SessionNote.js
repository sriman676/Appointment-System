const mongoose = require('mongoose');

const SessionNoteSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Counselor or Staff
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  isPrivate: { type: Boolean, default: true } // Internal only by default
}, { timestamps: true });

module.exports = mongoose.model('SessionNote', SessionNoteSchema);
