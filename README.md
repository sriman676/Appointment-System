# 📅 Appointment System

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7+-darkgreen.svg)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-4+-black.svg)](https://expressjs.com/)

A comprehensive, full-stack appointment management system built with **React**, **Express.js**, **Node.js**, and **MongoDB**. Perfect for counseling centers, clinics, salons, and service-based businesses.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Usage](#-usage) • [Documentation](#-documentation)

</div>

---

## � 10K Milestone Release

<div align="center">

**✨ v1.0.0 - Production Ready ✨**

🎉 **Join us in celebrating the 10K Project Milestone!**

This release marks a complete, production-grade appointment system ready for enterprise deployment.

📊 **78 Source Files** | 🚀 **Zero Dependencies Bloat** | 🔒 **Enterprise Security**

[📄 View Changelog](CHANGELOG.md) • [⭐ Star on GitHub](https://github.com/sriman676/Appointment-System)

</div>

---

## �🌟 Overview

The **Appointment System** is a modern, scalable web application designed to streamline appointment scheduling, management, and communication. With role-based access control, real-time notifications, and comprehensive analytics, it's built for both small businesses and enterprise-level operations.

### 👥 Who's It For?
- **Counseling Centers** - Manage student/client appointments efficiently
- **Healthcare Providers** - Schedule patient appointments and track follow-ups
- **Service Businesses** - Salons, spas, fitness centers
- **Educational Institutions** - Faculty office hours and meeting management
- **Corporate** - Meeting and resource scheduling

---

## ✨ Features

### 🔐 **Role-Based Access Control**
- **Students**: Book appointments, view history, cancel bookings, provide feedback
- **Counselors/Staff**: Manage availability, view appointments, create session notes, send notifications
- **Admin**: Full system oversight, analytics, user management, audit logs

### 📅 **Appointment Management**
- Intuitive appointment booking interface
- Real-time slot availability
- Calendar view with color-coded statuses
- Automatic waitlist management
- Recurring appointments support
- Bulk appointment scheduling for staff

### 🔔 **Notifications & Communication**
- Real-time in-app notifications
- Email notifications for appointments
- Automated reminders (24h, 1h before appointment)
- Customizable notification templates
- Session note attachment
- Feedback collection system

### 📊 **Analytics & Reporting**
- Comprehensive appointment analytics
- Counselor performance metrics
- User activity tracking
- Audit logs for compliance
- Appointment cancellation patterns
- Feedback analysis dashboard

### 🛡️ **Security Features**
- JWT-based authentication
- Input sanitization & validation
- CSRF protection
- Role-based authorization
- Email verification
- Password reset functionality
- Encrypted sensitive data

### 📱 **User Experience**
- Responsive design (mobile, tablet, desktop)
- Dark/Light theme support
- Accessible UI components
- Smooth animations
- Error handling & validation
- Loading skeletons

### 🔧 **Admin Features**
- User management (create, edit, delete, suspend)
- Blocked days configuration
- Appointment analytics dashboard
- System audit logs
- Feedback management
- Email template customization
- Category management

---

## 🛠️ Tech Stack

### **Frontend**
- **React 18** - UI framework
- **Vite** - Build tool (⚡ Fast HMR)
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Axios** - HTTP client
- **Context API** - State management
- **ESLint** - Code quality

### **Backend**
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Nodemailer** - Email service
- **Node-cron** - Scheduled jobs

### **DevOps & Tools**
- **npm** - Package management
- **Git** - Version control
- **Jest** - Testing framework
- **Postman** - API testing

---

## 📦 Project Structure

```
Appointment-System/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context (Auth, etc.)
│   │   ├── utils/           # Helper functions & API
│   │   ├── assets/          # Images, icons, fonts
│   │   └── App.jsx          # Main app component
│   ├── public/              # Static files
│   ├── vite.config.js       # Vite configuration
│   ├── tailwind.config.js   # Tailwind configuration
│   └── package.json
│
├── backend/                  # Express API
│   ├── config/              # Database config
│   ├── controllers/         # Route handlers
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── middleware/          # Custom middleware
│   ├── utils/               # Helper utilities
│   ├── tests/               # Test files
│   ├── server.js            # Entry point
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start

### **Prerequisites**
- **Node.js** v18+ and npm
- **MongoDB** (local or Atlas)
- **Git**

### **Installation**

#### 1. Clone the Repository
```bash
git clone https://github.com/sriman676/Appointment-System.git
cd Appointment-System
```

#### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cat > .env << EOF
PORT=5000
MONGODB_URI=mongodb://localhost:27017/appointment_system
JWT_SECRET=your_jwt_secret_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
NODE_ENV=development
EOF

# Start MongoDB (if running locally)
mongod

# Run server
npm start
```

#### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Create .env file (if needed)
cat > .env << EOF
VITE_API_URL=http://localhost:5000/api
EOF

# Start development server
npm run dev
```

#### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api

---

## 📖 Usage

### **User Workflows**

#### **Student Booking Appointment**
1. Login with credentials
2. Navigate to "Book Appointment"
3. Select counselor and preferred date/time
4. Confirm booking
5. Receive confirmation email

#### **Counselor Managing Appointments**
1. View dashboard with upcoming appointments
2. Set availability (blocked days, busy times)
3. View appointment details and session notes
4. Send notifications to students
5. Generate performance reports

#### **Admin Managing System**
1. Access admin dashboard
2. Manage users (create, edit, deactivate)
3. View system analytics
4. Review audit logs
5. Configure system settings

---

## 🔌 API Endpoints

### **Authentication**
```
POST   /api/auth/register      # User registration
POST   /api/auth/login         # User login
POST   /api/auth/refresh       # Refresh token
POST   /api/auth/logout        # User logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

### **Appointments**
```
GET    /api/appointments              # List appointments
POST   /api/appointments              # Create appointment
GET    /api/appointments/:id          # Get appointment details
PUT    /api/appointments/:id          # Update appointment
DELETE /api/appointments/:id          # Cancel appointment
GET    /api/appointments/slots        # Get available slots
```

### **Users**
```
GET    /api/users/profile             # Get user profile
PUT    /api/users/profile             # Update profile
GET    /api/users                     # List users (admin)
POST   /api/users                     # Create user (admin)
DELETE /api/users/:id                 # Delete user (admin)
```

### **Notifications**
```
GET    /api/notifications             # Get notifications
POST   /api/notifications             # Create notification
PUT    /api/notifications/:id/read    # Mark as read
DELETE /api/notifications/:id         # Delete notification
```

### **Feedback**
```
POST   /api/feedback                  # Submit feedback
GET    /api/feedback                  # List feedback (admin)
DELETE /api/feedback/:id              # Delete feedback (admin)
```

---

## 🧪 Testing

### **Run Tests**
```bash
cd backend
npm test
```

### **Test Coverage**
- Authentication tests
- Appointment logic tests
- Multi-user scenarios
- Security penetration tests

---

## 🔒 Security Features

✅ **JWT Authentication** - Secure token-based auth  
✅ **Password Hashing** - Bcrypt password encryption  
✅ **Input Validation** - XSS protection  
✅ **CORS** - Cross-origin security  
✅ **Rate Limiting** - DDoS protection  
✅ **Audit Logs** - Track all critical actions  
✅ **Email Verification** - Account verification  

---

## 🚀 Deployment

### **Backend (Heroku/Railway)**
```bash
# Build for production
npm run build

# Deploy with Procfile
git push heroku main
```

### **Frontend (Vercel/Netlify)**
```bash
# Build for production
npm run build

# Deploy
npm run deploy
```

---

## 🤝 Contributing

We love contributions! Here's how to get started:

### **Development Workflow**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write/update tests
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### **Code Guidelines**
- Follow ESLint rules
- Write clear commit messages
- Update documentation
- Add tests for new features
- Keep components small and reusable

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Srimannarayana**
- GitHub: [@sriman676](https://github.com/sriman676)
- Email: contact@example.com

---

## ⭐ Show Your Support

If this project helped you, please give it a star! ⭐ It helps other developers discover it.

---

## 📞 Support & Contact

- 📧 Email: support@appointmentsystem.com
- 💬 Issues: [GitHub Issues](https://github.com/sriman676/Appointment-System/issues)
- 📚 Documentation: [Wiki](https://github.com/sriman676/Appointment-System/wiki)

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Video conferencing integration
- [ ] SMS notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Payment integration
- [ ] Calendar sync (Google, Outlook)
- [ ] AI-powered scheduling

---

<div align="center">

**Made with ❤️ by Srimannarayana**

[⬆ back to top](#-appointment-system)

</div>
