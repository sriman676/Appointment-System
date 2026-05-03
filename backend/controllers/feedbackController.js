const Feedback = require('../models/Feedback');
const Appointment = require('../models/Appointment');

// ─── SUBMIT FEEDBACK ─────────────────────────────────────────────────────────
exports.submitFeedback = async (req, res) => {
  try {
    const { appointmentId, rating, comment } = req.body;

    if (!appointmentId || !rating) {
      return res.status(400).json({ message: 'appointmentId and rating are required.' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });

    // Only the student of this appointment can submit feedback
    if (String(appointment.studentId) !== String(req.user._id)) {
      console.warn(`SECURITY: Unauthorized Feedback Attempt by ${req.user.email} on Appointment ${appointmentId}`);
      return res.status(403).json({ message: 'Only the student of this appointment can submit feedback.' });
    }

    if (appointment.status !== 'Completed') {
      return res.status(400).json({ message: 'Feedback can only be submitted for Completed appointments.' });
    }

    // Prevent duplicate feedback
    const existing = await Feedback.findOne({ appointmentId, studentId: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'Feedback already submitted for this appointment.' });
    }

    const feedback = await Feedback.create({
      appointmentId,
      studentId: req.user._id,
      hostId: appointment.hostId,
      rating: parseInt(rating),
      comment: comment?.trim() || ''
    });

    res.status(201).json({ message: 'Thank you for your feedback!', feedback });
  } catch (error) {
    console.error('submitFeedback error:', error);
    res.status(500).json({ message: 'Server error submitting feedback.' });
  }
};

// ─── GET FEEDBACK (Admin sees all; host sees own) ────────────────────────────
exports.getFeedback = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'Administrator') {
      // Admin sees all feedback (for analytics)
    } else if (req.user.role === 'Counselor' || req.user.role === 'Staff') {
      query.hostId = req.user._id;
    } else {
      return res.status(403).json({ message: 'Not authorized to view feedback.' });
    }

    const feedback = await Feedback.find(query)
      .populate('studentId', 'name')
      .populate('hostId', 'name role')
      .populate('appointmentId', 'date startTime')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching feedback.' });
  }
};
