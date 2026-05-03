const User = require('../models/User');
const Request = require('../models/Request');
const Appointment = require('../models/Appointment');
const Feedback = require('../models/Feedback');
const Category = require('../models/Category');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');

// ─── ANALYTICS DASHBOARD ─────────────────────────────────────────────────────
exports.getAnalytics = async (req, res) => {
  try {
    const [
      totalRequests,
      pendingRequests,
      escalatedRequests,
      acceptedRequests,
      rejectedRequests,
      expiredRequests,
      completedAppointments,
      noShowAppointments,
      totalUsers,
      avgRating,
      categoryStats,
      counselorWorkload
    ] = await Promise.all([
      Request.countDocuments(),
      Request.countDocuments({ status: 'Pending' }),
      Request.countDocuments({ status: 'Escalated' }),
      Request.countDocuments({ status: 'Accepted' }),
      Request.countDocuments({ status: 'Rejected' }),
      Request.countDocuments({ status: 'Expired' }),
      Appointment.countDocuments({ status: 'Completed' }),
      Appointment.countDocuments({ status: 'NoShow' }),
      User.countDocuments({ role: 'Student' }),
      Feedback.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
      // Category popularity
      Request.aggregate([
        { $group: { _id: '$categoryId', count: { $sum: 1 } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
        { $unwind: { path: '$category', preserveNullAndEmpty: true } },
        { $project: { name: '$category.name', count: 1 } },
        { $sort: { count: -1 } }
      ]),
      // Counselor workload
      Appointment.aggregate([
        { $match: { status: { $in: ['Scheduled', 'Rescheduled', 'Completed'] } } },
        { $group: { _id: '$hostId', total: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'host' } },
        { $unwind: '$host' },
        { $project: { name: '$host.name', role: '$host.role', total: 1 } },
        { $sort: { total: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      requests: {
        total: totalRequests,
        pending: pendingRequests,
        escalated: escalatedRequests,
        accepted: acceptedRequests,
        rejected: rejectedRequests,
        expired: expiredRequests
      },
      appointments: {
        completed: completedAppointments,
        noShow: noShowAppointments
      },
      students: { total: totalUsers },
      avgFeedbackRating: avgRating[0]?.avg?.toFixed(2) || 'N/A',
      categoryPopularity: categoryStats,
      counselorWorkload
    });
  } catch (error) {
    console.error('getAnalytics error:', error);
    res.status(500).json({ message: 'Server error fetching analytics.' });
  }
};

// ─── MANAGE USERS ────────────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search = '' } = req.query;
    let query = role ? { role } : {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query).select('-password').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching users.' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, categories } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'name, email, password, role are required.' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'User already exists.' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      role,
      categories: categories || [],
      emailVerified: true
    });

    await AuditLog.create({ adminId: req.user._id, action: `Created user ${role}`, targetId: user._id, details: `Email: ${email}` });

    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Server error creating user.' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ message: 'Admins cannot delete their own account.' });
    }

    await user.deleteOne();
    await AuditLog.create({ adminId: req.user._id, action: 'Deleted user', targetId: user._id, details: `Removed: ${user.email}` });

    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting user.' });
  }
};

// ─── MANAGE CATEGORIES ───────────────────────────────────────────────────────
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required.' });

    const exists = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (exists) return res.status(400).json({ message: 'Category already exists.' });

    const category = await Category.create({ name: name.trim(), description: description?.trim() || '' });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating category.' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching categories.' });
  }
};

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description.trim();
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating category' });
  }
};

// @desc    Delete category (Soft delete / Deactivate)
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    category.isActive = false;
    await category.save();
    res.json({ message: 'Category deactivated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting category' });
  }
};

// ─── AUDIT LOGS ─────────────────────────────────────────────────────────────
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find()
        .populate('adminId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments()
    ]);

    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching audit logs.' });
  }
};

// ─── ADMIN REQUESTS LISTING (with filtering) ────────────────────────────────
exports.getAdminRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, categoryId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (categoryId) query.categoryId = categoryId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [requests, total] = await Promise.all([
      Request.find(query)
        .populate('studentId', 'name email')
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Request.countDocuments(query)
    ]);

    res.json({ requests, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching admin requests.' });
  }
};

// ─── DATA EXPORT (CSV) ───────────────────────────────────────────────────────
exports.exportRequests = async (req, res) => {
  try {
    const requests = await Request.find()
      .populate('studentId', 'name email')
      .populate('categoryId', 'name')
      .populate('counselorId', 'name')
      .populate('staffId', 'name')
      .sort({ createdAt: -1 });

    let csv = 'Subject,Description,Status,Student,Category,AssignedTo,Mode,Created\n';
    
    requests.forEach(r => {
      const assigned = (r.counselorId?.name || r.staffId?.name || 'Unassigned');
      csv += `"${r.subject}","${r.description?.replace(/"/g, '""')}","${r.status}","${r.studentId?.name}","${r.categoryId?.name || 'N/A'}","${assigned}","${r.meetingMode}","${r.createdAt.toISOString()}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('counselling_requests_export.csv');
    res.send(csv);
  } catch (error) {
    console.error('exportRequests error:', error);
    res.status(500).json({ message: 'Server error exporting data.' });
  }
};
