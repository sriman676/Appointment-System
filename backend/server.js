const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const startCronJobs = require('./utils/cronJobs');

const mongoSanitize = require('./middleware/sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const AuditLog = require('./models/AuditLog');

// Load env variables
dotenv.config();

// Connect to database
if (process.env.NODE_ENV !== 'test') {
  connectDB();
  // Start Background Cron Jobs
  startCronJobs();
}

const app = express();

// SECURITY: Helmet - Advanced Headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false, // Standard CSP or disabled for local dev speed
  crossOriginEmbedderPolicy: false,
  frameguard: { action: 'deny' }, // Prevent Clickjacking
  xssFilter: true, // Prevent XSS in older browsers
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login/OTP attempts, please try again in 15 minutes.'
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Prevent NoSQL Injection
app.use(mongoSanitize);

// SECURITY: Minimalist XSS Sanitizer for req.body (Express 5 compatible)
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
    });
  }
  next();
});

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test Route
app.get('/', (req, res) => res.send('API Running'));

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  if (err.status === 403 || err.name === 'ForbiddenError') {
    // Log unauthorized access attempts
    AuditLog.create({ 
      adminId: null, 
      action: 'UNAUTHORIZED_ACCESS_BLOCKED', 
      details: `IP: ${req.ip} tried to access ${req.originalUrl}` 
    }).catch(e => console.error('Failed to log audit:', e));
  }
  
  console.error('Global error:', err.stack);
  const status = err.status || 500;
  res.status(status).json({ 
    message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Internal server error.'
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}

module.exports = app;
