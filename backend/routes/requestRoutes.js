const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const requestController = require('../controllers/requestController');

router.route('/')
  .post(protect, authorize('Student'), requestController.createRequest)
  .get(protect, requestController.getRequests);

router.route('/:id')
  .put(protect, requestController.updateRequest)
  .delete(protect, authorize('Administrator'), requestController.deleteRequest);

module.exports = router;
