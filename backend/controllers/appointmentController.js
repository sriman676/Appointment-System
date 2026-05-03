const Appointment = require('../models/Appointment');
const Request = require('../models/Request');
const BlockedDay = require('../models/BlockedDay');
const Notification = require('../models/Notification');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { getNotificationEmail } = require('../utils/emailTemplates');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

// ─── Generate available time slots ───────────────────────────────────────────
exports.getAvailableSlots = async (req, res) => {
  try {
    const { hostId, date, duration = 30 } = req.query;

    if (!hostId || !date) {
      return res.status(400).json({ message: 'hostId and date are required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(hostId)) {
      return res.status(400).json({ message: 'Invalid hostId.' });
    }

    const slotDate = new Date(date);
    if (isNaN(slotDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format.' });
    }

    // Check if the day is blocked for this host
    const startOfDay = new Date(slotDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay   = new Date(slotDate); endOfDay.setHours(23, 59, 59, 999);

    const blocked = await BlockedDay.findOne({ userId: hostId, date: { $gte: startOfDay, $lte: endOfDay } });
    if (blocked) {
      return res.json({ slots: [], message: `Host unavailable: ${blocked.reason || 'day blocked'}` });
    }

    // Get already-booked appointments for that host on that day
    const booked = await Appointment.find({
      hostId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['Scheduled', 'Rescheduled'] }
    }).select('startTime endTime');

    const bookedTimes = new Set(booked.map(a => a.startTime));

    // Generate all possible slots between 09:00 and 17:00
    const slots = [];
    const durationNum = parseInt(duration);
    let currentHour = 9, currentMinute = 0;

    while (currentHour < 17) {
      const endMinute = currentMinute + durationNum;
      const endH = currentHour + Math.floor(endMinute / 60);
      const endM = endMinute % 60;

      if (endH > 17 || (endH === 17 && endM > 0)) break;

      const startStr = `${String(currentHour).padStart(2,'0')}:${String(currentMinute).padStart(2,'0')}`;
      const endStr   = `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`;

      slots.push({
        start: startStr,
        end: endStr,
        available: !bookedTimes.has(startStr)
      });

      // Advance by duration
      currentMinute += durationNum;
      currentHour   += Math.floor(currentMinute / 60);
      currentMinute %= 60;
    }

    res.json({ slots });
  } catch (error) {
    console.error('getAvailableSlots error:', error);
    res.status(500).json({ message: 'Server error fetching slots.' });
  }
};

// ─── CREATE APPOINTMENT (from accepted request) ───────────────────────────────
// Uses findOneAndUpdate with upsert:false as an atomic "claim" to prevent double-booking
exports.createAppointment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { requestId, date, startTime, endTime, googleMeetLink } = req.body;

    if (!requestId || !date || !startTime || !endTime) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'requestId, date, startTime, endTime are required.' });
    }

    const request = await Request.findById(requestId).session(session);
    if (!request) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Request not found.' });
    }
    if (request.status !== 'Accepted') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Only Accepted requests can be converted to appointments.' });
    }

    const hostId = request.counselorId || request.staffId;
    if (!hostId) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'No host assigned to this request.' });
    }

    // Only the assigned host, student (request owner), or admin can create the appointment
    const isHost    = String(req.user._id) === String(hostId);
    const isStudent = String(req.user._id) === String(request.studentId);
    const isAdmin   = req.user.role === 'Administrator';
    
    if (!isHost && !isStudent && !isAdmin) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Not authorized to create this appointment.' });
    }

    // ── ATOMIC CONFLICT CHECK: prevent double-booking ──────────────────────
    // Attempt to insert — if a doc with same hostId+date+startTime already exists, this throws E11000
    const slotDate = new Date(date);
    const conflict = await Appointment.findOne({
      hostId,
      date: { $gte: new Date(slotDate.setHours(0,0,0,0)), $lte: new Date(slotDate.setHours(23,59,59,999)) },
      startTime,
      status: { $in: ['Scheduled', 'Rescheduled'] }
    }).session(session);

    if (conflict) {
      await session.abortTransaction();
      return res.status(409).json({ message: `Time slot ${startTime} is already booked for this host on ${date}.` });
    }

    const [appointment] = await Appointment.create([{
      requestId,
      studentId: request.studentId,
      hostId,
      date: new Date(date),
      startTime,
      endTime,
      meetingMode: request.meetingMode,
      googleMeetLink: googleMeetLink || null,
    }], { session });

    // Mark request as no longer pending (keep as Accepted, appointment links back)
    await session.commitTransaction();

    // Notify both parties via system and email
    const student = await User.findById(request.studentId).session(session);
    const host = await User.findById(hostId).session(session);

    const studentMsg = `Your appointment for ${new Date(date).toDateString()} at ${startTime} has been confirmed.`;
    const hostMsg = `New appointment scheduled with student on ${new Date(date).toDateString()} at ${startTime}.`;

    await Promise.all([
      Notification.create([{ userId: request.studentId, message: studentMsg, type: 'appointment' }], { session }),
      Notification.create([{ userId: hostId, message: hostMsg, type: 'appointment' }], { session }),
      sendEmail({
        email: student.email,
        subject: 'Appointment Confirmed - SRMAP Counselling',
        message: studentMsg,
        html: getNotificationEmail(studentMsg, `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student`)
      }),
      sendEmail({
        email: host.email,
        subject: 'New Appointment Scheduled',
        message: hostMsg,
        html: getNotificationEmail(hostMsg, `${process.env.FRONTEND_URL || 'http://localhost:5173'}/${host.role.toLowerCase()}`)
      })
    ]);

    res.status(201).json(appointment);
  } catch (error) {
    await session.abortTransaction();
    console.error('createAppointment error:', error);
    if (error.code === 11000 || error.code === 112 || (error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError')) || (error.errorLabels && error.errorLabels.includes('TransientTransactionError'))) {
      return res.status(409).json({ message: 'Slot already booked (concurrent booking conflict).' });
    }
    res.status(500).json({ message: 'Server error creating appointment.' });
  } finally {
    session.endSession();
  }
};

// ─── GET APPOINTMENTS (user-scoped by role) ──────────────────────────────────
exports.getAppointments = async (req, res) => {
  try {
    let query = {};
    const { status, page = 1, limit = 20 } = req.query;

    switch (req.user.role) {
      case 'Student':
        query.studentId = req.user._id;
        break;
      case 'Counselor':
      case 'Staff':
        query.hostId = req.user._id;
        break;
      case 'Administrator':
        break; // sees all
      default:
        return res.status(403).json({ message: 'Not authorized.' });
    }

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('studentId', 'name email')
        .populate('hostId', 'name email role')
        .populate('requestId', 'subject categoryId meetingMode')
        .sort({ date: 1, startTime: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Appointment.countDocuments(query)
    ]);

    res.json({ appointments, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('getAppointments error:', error);
    res.status(500).json({ message: 'Server error fetching appointments.' });
  }
};

// ─── UPDATE APPOINTMENT (status transitions, notes, reschedule) ──────────────
exports.updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });

    const { role, _id: userId } = req.user;
    const { status, notes, googleMeetLink } = req.body;

    const isStudent = role === 'Student' && String(appointment.studentId) === String(userId);
    const isHost    = (role === 'Counselor' || role === 'Staff') && String(appointment.hostId) === String(userId);
    const isAdmin   = role === 'Administrator';

    if (!isStudent && !isHost && !isAdmin) {
      // SECURITY: forensic record of unauthorized update attempt
      AuditLog.create({
        userId: userId,
        role: role,
        action: 'SECURITY_VIOLATION_APPOINTMENT_UPDATE',
        targetId: appointment._id,
        details: `Unauthorized attempt to update appointment by ${req.user.email}`,
        ip: req.ip
      }).catch(e => console.error('Audit failed:', e));
      
      return res.status(403).json({ message: 'Not authorized to update this appointment.' });
    }

    // Students can only request reschedule or cancel
    if (isStudent && status && !['RescheduleRequested', 'Cancelled'].includes(status)) {
      return res.status(403).json({ message: 'Students can only request reschedule or cancel.' });
    }

    // Only hosts/admin can add private notes
    if (notes && isStudent) {
      return res.status(403).json({ message: 'Students cannot add notes.' });
    }

    if (status) appointment.status = status;
    if (notes  && (isHost || isAdmin)) appointment.notes = notes;
    if (googleMeetLink && (isHost || isAdmin)) appointment.googleMeetLink = googleMeetLink;

    await appointment.save();

    // Notify counterpart
    const notifyUserId = isStudent ? appointment.hostId : appointment.studentId;
    const targetUser = await User.findById(notifyUserId);
    const updateMsg = `Appointment status updated to ${status || 'updated'}.`;

    await Promise.all([
      Notification.create({
        userId: notifyUserId,
        message: updateMsg,
        type: 'appointment'
      }),
      sendEmail({
        email: targetUser.email,
        subject: 'Appointment Status Update',
        message: updateMsg,
        html: getNotificationEmail(updateMsg, `${process.env.FRONTEND_URL || 'http://localhost:5173'}/${targetUser.role.toLowerCase()}`)
      })
    ]);

    res.json(appointment);
  } catch (error) {
    console.error('updateAppointment error:', error);
    res.status(500).json({ message: 'Server error updating appointment.' });
  }
};

// ─── BLOCK A DAY (Counselor/Staff only) ─────────────────────────────────────
exports.blockDay = async (req, res) => {
  try {
    const { date, reason } = req.body;
    if (!date) return res.status(400).json({ message: 'date is required.' });

    const blocked = await BlockedDay.create({
      userId: req.user._id,
      date: new Date(date),
      reason: reason || ''
    });

    res.status(201).json(blocked);
  } catch (error) {
    res.status(500).json({ message: 'Server error blocking day.' });
  }
};
