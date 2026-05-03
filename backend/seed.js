const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Category = require('./models/Category');
const connectDB = require('./config/db');

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear DB
    await User.deleteMany();
    await Category.deleteMany();

    // Create Categories
    const categories = await Category.insertMany([
      { name: 'Academic Counseling', description: 'Help with courses and degrees' },
      { name: 'Mental Health Support', description: 'Confidential therapy and support' },
      { name: 'Career Counseling', description: 'Resume, internships, and job search' }
    ]);

    // Create Admin
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('admin123', salt);

    await User.create({
      name: 'System Admin',
      email: 'admin@college.edu',
      password,
      role: 'Administrator',
      emailVerified: true
    });

    // Create Staff
    await User.create({
      name: 'Staff Member',
      email: 'staff@college.edu',
      password,
      role: 'Staff',
      emailVerified: true
    });

    // Create Counselor
    const counselorUser = await User.create({
      name: 'Jane Counselor',
      email: 'jane@college.edu',
      password,
      role: 'Counselor',
      emailVerified: true,
      categories: [categories[0]._id, categories[1]._id]
    });

    // Create Student
    await User.create({
      name: 'John Student',
      email: 'john@college.edu',
      password,
      role: 'Student',
      emailVerified: true
    });

    console.log('Seed Data Inserted Successfully');
    process.exit();
  } catch (error) {
    console.error('Seed Error:', error.message);
    process.exit(1);
  }
};

seedData();
