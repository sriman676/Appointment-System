const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAnalytics,
  getUsers,
  createUser,
  deleteUser,
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  getAuditLogs,
  exportRequests,
  getAdminRequests
} = require('../controllers/adminController');

// All routes: must be logged in + Administrator role
router.use(protect);
router.use(authorize('Administrator'));

router.get('/analytics', getAnalytics);

router.route('/users')
  .get(getUsers)
  .post(createUser);

router.delete('/users/:id', deleteUser);

router.route('/categories')
  .get(getCategories)
  .post(createCategory);

router.route('/categories/:id')
  .put(updateCategory)
  .delete(deleteCategory);

router.get('/audit-logs', getAuditLogs);
router.get('/requests', getAdminRequests);
router.get('/export/requests', exportRequests);

module.exports = router;
