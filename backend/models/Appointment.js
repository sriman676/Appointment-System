const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // counselor or staff
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  meetingMode: { type: String, enum: ['Online', 'In-Person'], required: true },
  googleMeetLink: { type: String }, // For online meetings
  status: { 
    type: String, 
    enum: ['Scheduled', 'RescheduleRequested', 'Rescheduled', 'Completed', 'NoShow', 'Cancelled'],
    default: 'Scheduled'
  },
  reminderSent: { type: Boolean, default: false },
  notes: { type: String }, // Private notes, only for counselor/staff
  followUpTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' } // If this is a follow-up
}, { timestamps: true });

// Unique compound index: one booking per host per date per start time
AppointmentSchema.index(
  { hostId: 1, date: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['Scheduled', 'Rescheduled'] } }
  }
);

module.exports = mongoose.model('Appointment', AppointmentSchema);
