const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAvailableSlots,
  createAppointment,
  getAppointments,
  updateAppointment,
  blockDay
} = require('../controllers/appointmentController');

// Available slots — any authenticated user can query
router.get('/slots', protect, getAvailableSlots);

// CRUD
router.route('/')
  .post(protect, authorize('Counselor', 'Staff', 'Administrator'), createAppointment)
  .get(protect, getAppointments);

router.route('/:id')
  .put(protect, updateAppointment);

// Block a day (counselor / staff)
router.post('/block-day', protect, authorize('Counselor', 'Staff', 'Administrator'), blockDay);

module.exports = router;
