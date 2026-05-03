/**
 * Custom email templates for SRMAP Student Counselling System
 */

const getHtmlTemplate = (title, content, buttonLabel = null, buttonLink = null) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #1d4ed8 0%, #312e81 100%); padding: 40px 20px; text-align: center; color: #ffffff; }
        .logo { font-size: 24px; font-weight: bold; letter-spacing: -0.025em; margin-bottom: 8px; }
        .title { font-size: 18px; opacity: 0.9; }
        .content { padding: 40px 30px; line-height: 1.6; color: #334155; }
        .otp-box { background-color: #f1f5f9; padding: 24px; border-radius: 16px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 32px; font-weight: 800; color: #1e293b; letter-spacing: 0.25em; }
        .button-container { text-align: center; margin-top: 32px; }
        .button { background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; }
        .footer { padding: 24px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">SRMAP Counselling</div>
          <div class="title">${title}</div>
        </div>
        <div class="content">
          ${content}
          ${buttonLabel && buttonLink ? `
            <div class="button-container">
              <a href="${buttonLink}" class="button">${buttonLabel}</a>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} SRMAP Student Counselling Management System<br>
          This is an automated message, please do not reply.
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  getOtpEmail: (otp) => getHtmlTemplate(
    'Verify Your Account',
    `<p>Hello,</p>
     <p>Your one-time verification code is below. Please enter this code on the verification screen to complete your registration or login.</p>
     <div class="otp-box"><span class="otp-code">${otp}</span></div>
     <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>`
  ),
  getNotificationEmail: (message, dashboardLink) => getHtmlTemplate(
    'New Activity Alert',
    `<p>Hello,</p>
     <p>${message}</p>
     <p>You can view more details about this update directly on your dashboard.</p>`,
    'View Dashboard',
    dashboardLink
  ),
  getReminderEmail: (time, dashboardLink) => getHtmlTemplate(
    'Upcoming Session Reminder',
    `<p>Hello,</p>
     <p>This is a reminder that you have an upcoming counselling session scheduled for <strong>${time}</strong>.</p>
     <p>Please ensure you are prepared and available at the scheduled time.</p>`,
    'View Session',
    dashboardLink
  )
};
