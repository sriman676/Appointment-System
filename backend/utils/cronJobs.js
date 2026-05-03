const cron = require('node-cron');
const Request = require('../models/Request');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const sendEmail = require('./sendEmail');
const { getReminderEmail } = require('./emailTemplates');

const startCronJobs = () => {
  // Run every hour to check for escalations and expirations
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Running Escalation and Expiration Cron Jobs...');
      
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // 1. Escalate requests pending for > 24 hours
      const pendingToEscalate = await Request.updateMany(
        { status: 'Pending', createdAt: { $lte: yesterday } },
        { $set: { status: 'Escalated' } }
      );
      if (pendingToEscalate.modifiedCount > 0) {
        console.log(`Escalated ${pendingToEscalate.modifiedCount} requests to Admin.`);
        // Could trigger email to Admin here
      }

      // 2. Expire requests pending for > 48 hours
      // Since earlier ones are 'Escalated', we should also check if Escalated ones > 48h should just Expire
      const expiredRequests = await Request.updateMany(
        { status: { $in: ['Pending', 'Escalated'] }, expiresAt: { $lte: now } },
        { $set: { status: 'Expired' } }
      );
      if (expiredRequests.modifiedCount > 0) {
        console.log(`Expired ${expiredRequests.modifiedCount} requests.`);
        // Could trigger email to Student here
      }

      // 3. REMINDER JOB: Send reminders 1h before appointment
      const reminderThreshold = new Date(now.getTime() + 90 * 60 * 1000); // 1.5 hours from now
      const upcoming = await Appointment.find({
        status: { $in: ['Scheduled', 'Rescheduled'] },
        reminderSent: false,
        date: { $gte: startOfDay, $lte: endOfDay }
      }).populate('studentId hostId');

      for (const appt of upcoming) {
        // Simple string time comparison (e.g., '14:00')
        const [h, m] = appt.startTime.split(':').map(Number);
        const apptDate = new Date(appt.date);
        apptDate.setHours(h, m, 0, 0);

        if (apptDate > now && apptDate <= reminderThreshold) {
          console.log(`Sending reminder for appointment ${appt._id} at ${appt.startTime}`);
          
          await Promise.all([
            sendEmail({
              email: appt.studentId.email,
              subject: 'Upcoming Session Reminder - SRMAP Counselling',
              message: `You have a session today at ${appt.startTime}`,
              html: getReminderEmail(`${appt.startTime} Today`, `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student`)
            }),
            sendEmail({
              email: appt.hostId.email,
              subject: 'Upcoming Session Reminder - SRMAP Counselling',
              message: `You have a session today at ${appt.startTime}`,
              html: getReminderEmail(`${appt.startTime} Today`, `${process.env.FRONTEND_URL || 'http://localhost:5173'}/${appt.hostId.role.toLowerCase()}`)
            })
          ]);

          appt.reminderSent = true;
          await appt.save();
        }
      }

    } catch (error) {
      console.error('Error in cron job:', error.message);
    }
  });
};

module.exports = startCronJobs;
