const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, select: false },
  role: { 
    type: String, 
    enum: ['Student', 'Counselor', 'Staff', 'Administrator'], 
    default: 'Student' 
  },
  googleId: { type: String },
  emailVerified: { type: Boolean, default: false },
  otp: { type: String, select: false },
  otpExpires: { type: Date, select: false },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }], // for counselors
  profileImage: { type: String },
  activeRequestsCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
