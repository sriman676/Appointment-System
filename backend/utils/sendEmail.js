const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // During tests, don't attempt to send real emails
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const message = {
      from: `${process.env.EMAIL_FROM || 'SRMAP Counselling'} <${process.env.SMTP_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    const info = await transporter.sendMail(message);
    if (process.env.NODE_ENV !== 'production') {
      console.log('Message sent: %s', info.messageId);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Email sending failed (this is expected if SMTP credentials are mock). Options:', options);
    }
  }
};

module.exports = sendEmail;
