const Request = require('../models/Request');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { getNotificationEmail } = require('../utils/emailTemplates');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

// ─── CREATE REQUEST ──────────────────────────────────────────────────────────
// Only Students. Enforces active-request cap and daily limit.
exports.createRequest = async (req, res) => {
  try {
    const { categoryId, counselorId, staffId, requestType, subject, meetingMode, preferredDate, preferredTime, duration } = req.body;

    // --- Input validation ---
    if (!categoryId || !requestType || !subject || !meetingMode || !preferredDate || !preferredTime) {
      return res.status(400).json({ message: 'Missing required fields: categoryId, requestType, subject, meetingMode, preferredDate, preferredTime' });
    }
    if (!['Counseling', 'Staff Appointment'].includes(requestType)) {
      return res.status(400).json({ message: 'Invalid requestType. Must be Counseling or Staff Appointment.' });
    }
    if (!['Online', 'In-Person'].includes(meetingMode)) {
      return res.status(400).json({ message: 'Invalid meetingMode. Must be Online or In-Person.' });
    }
    if (requestType === 'Staff Appointment' && !staffId) {
      return res.status(400).json({ message: 'Staff member must be selected for Staff Appointments.' });
    }

    // --- Validate preferredDate is not in the past ---
    const reqDate = new Date(preferredDate);
    if (isNaN(reqDate.getTime()) || reqDate < new Date()) {
      return res.status(400).json({ message: 'preferredDate must be a valid future date.' });
    }

    // --- Validate working hours (09:00–17:00) ---
    const [hour, minute] = (preferredTime || '').split(':').map(Number);
    if (isNaN(hour) || hour < 9 || (hour === 17 && minute > 0) || hour > 16) {
      return res.status(400).json({ message: 'Preferred time must be within working hours: 09:00 – 17:00.' });
    }

    // --- Active request cap: max 3 per student ---
    const activeCount = await Request.countDocuments({
      studentId: req.user._id,
      status: { $in: ['Pending', 'Escalated'] }
    });
    if (activeCount >= 3) {
      return res.status(400).json({ message: 'Maximum active requests (3) reached. Please wait for existing requests to be processed.' });
    }

    // --- Daily limit: max 5 per student ---
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
    const dailyCount = await Request.countDocuments({
      studentId: req.user._id,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    if (dailyCount >= 5) {
      return res.status(400).json({ message: 'Daily request limit (5) reached. Please try again tomorrow.' });
    }

    // --- If counselor specified, verify they exist and have the category ---
    if (counselorId) {
      if (!mongoose.Types.ObjectId.isValid(counselorId)) {
        return res.status(400).json({ message: 'Invalid counselorId.' });
      }
      const counselor = await User.findOne({ _id: counselorId, role: 'Counselor', categories: categoryId });
      if (!counselor) {
        return res.status(404).json({ message: 'Selected counselor not found or does not handle this category.' });
      }
    }

    const newRequest = await Request.create({
      studentId: req.user._id,
      categoryId,
      counselorId: counselorId || null,
      staffId: staffId || null,
      requestType,
      subject: subject.trim(),
      meetingMode,
      preferredDate: reqDate,
      preferredTime,
      duration: duration || 30,
    });

    // Notify counselor(s) in-app
    if (counselorId) {
      await Notification.create({
        userId: counselorId,
        message: `New counseling request from ${req.user.name}: "${subject}"`,
        type: 'request'
      });
    }

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('createRequest error:', error);
    res.status(500).json({ message: 'Server error creating request.' });
  }
};

// ─── GET REQUESTS (user-scoped by role) ─────────────────────────────────────
exports.getRequests = async (req, res) => {
  try {
    let query = {};
    const { status, page = 1, limit = 20 } = req.query;

    // Reload user fresh from DB (picks up category assignments made after jwt was issued)
    const freshUser = await User.findById(req.user._id);
    if (!freshUser) return res.status(401).json({ message: 'User not found.' });

    switch (freshUser.role) {
      case 'Student':
        query.studentId = freshUser._id;
        break;
      case 'Counselor':
        // Sees requests directly assigned to them OR unassigned in their categories
        query.$or = [
          { counselorId: freshUser._id },
          { counselorId: null, categoryId: { $in: freshUser.categories || [] } }
        ];
        break;
      case 'Staff':
        query.staffId = freshUser._id;
        break;
      case 'Administrator':
        break; // sees all
      default:
        return res.status(403).json({ message: 'Not authorized to view requests.' });
    }

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [requests, total] = await Promise.all([
      Request.find(query)
        .populate('studentId', 'name email')
        .populate('counselorId', 'name email')
        .populate('staffId', 'name email')
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Request.countDocuments(query)
    ]);

    res.json({ requests, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('getRequests error:', error);
    res.status(500).json({ message: 'Server error fetching requests.' });
  }
};

// ─── UPDATE REQUEST (Accept / Reject / Cancel / Reschedule) ─────────────────
exports.updateRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('counselorId', 'name email')
      .populate('staffId', 'name email');

    if (!request) return res.status(404).json({ message: 'Request not found.' });

    const { role, _id: userId } = req.user;
    const { status, rejectionReason, meetingMode } = req.body;

    // --- Authorization check: only the assigned host or admin can update ---
    const isStudent     = role === 'Student'        && String(request.studentId._id) === String(userId);
    const isCounselor   = role === 'Counselor'      && (String(request.counselorId?._id) === String(userId) || !request.counselorId);
    const isStaff       = role === 'Staff'          && String(request.staffId?._id)   === String(userId);
    const isAdmin       = role === 'Administrator';

    if (!isStudent && !isCounselor && !isStaff && !isAdmin) {
      // SECURITY: Persistent forensic record of unauthorized update attempt
      AuditLog.create({
        userId: userId,
        role: role,
        action: 'SECURITY_VIOLATION_REQUEST_UPDATE',
        targetId: request._id,
        details: `Unauthorized attempt to update request by ${req.user.email}`,
        ip: req.ip
      }).catch(e => console.error('Audit failed:', e));
      
      return res.status(403).json({ message: 'Not authorized to update this request.' });
    }

    // --- Status transition rules ---
    const allowedTransitions = {
      Student:        { Pending: ['Cancelled'], Accepted: ['RescheduleRequested'] },
      Counselor:      { Pending: ['Accepted', 'Rejected'], Escalated: ['Accepted', 'Rejected'] },
      Staff:          { Pending: ['Accepted', 'Rejected'], Escalated: ['Accepted', 'Rejected'] },
      Administrator:  { Escalated: ['Accepted', 'Rejected', 'Expired'], Pending: ['Accepted', 'Rejected', 'Expired'] },
    };
    const allowed = allowedTransitions[role]?.[request.status] || [];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ message: `Cannot transition from ${request.status} to ${status} as ${role}.` });
    }

    if (status === 'Rejected' && !rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is mandatory.' });
    }

    // --- Assign counselor if unassigned and counselor is accepting ---
    if (isCounselor && status === 'Accepted' && !request.counselorId) {
      request.counselorId = userId;
    }

    if (status) request.status = status;
    if (rejectionReason) request.rejectionReason = rejectionReason;
    if (meetingMode && (isCounselor || isStaff)) request.meetingMode = meetingMode; // host override

    await request.save();

    // --- Notify the student via system and email ---
    const student = await User.findById(request.studentId._id);
    const notifyMsg = status === 'Accepted'
      ? `Your request "${request.subject}" has been accepted!`
      : status === 'Rejected'
      ? `Your request "${request.subject}" was rejected. Reason: ${rejectionReason}`
      : `Your request "${request.subject}" status changed to ${status}.`;

    await Promise.all([
      Notification.create({ userId: student._id, message: notifyMsg, type: 'request' }),
      sendEmail({
        email: student.email,
        subject: `Request Update: ${status}`,
        message: notifyMsg,
        html: getNotificationEmail(notifyMsg, `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student`)
      })
    ]);

    res.json(request);
  } catch (error) {
    console.error('updateRequest error:', error);
    res.status(500).json({ message: 'Server error updating request.' });
  }
};

// ─── DELETE REQUEST (Admin only) ─────────────────────────────────────────────
exports.deleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    await request.deleteOne();
    res.json({ message: 'Request deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting request.' });
  }
};
