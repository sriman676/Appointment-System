const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { submitFeedback, getFeedback } = require('../controllers/feedbackController');

router.post('/', protect, authorize('Student'), submitFeedback);
router.get('/', protect, authorize('Administrator', 'Counselor', 'Staff'), getFeedback);

module.exports = router;
