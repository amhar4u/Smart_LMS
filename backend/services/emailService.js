const nodemailer = require('nodemailer');

/**
 * Email Service for sending notifications
 * Configured with Gmail SMTP
 */

// Create reusable transporter object using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'noreply.smartlms@gmail.com',
      pass: process.env.EMAIL_PASS || 'xhjx scej yuom qxfm'
    }
  });
};

/**
 * Send account verification email
 * @param {Object} user - User object containing email, firstName, lastName, role
 * @returns {Promise<Object>} - Email sending result
 */
const sendVerificationEmail = async (user) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'Smart LMS',
        address: process.env.EMAIL_USER || 'noreply.smartlms@gmail.com'
      },
      to: user.email,
      subject: '✅ Your Smart LMS Account Has Been Verified',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px 20px;
            }
            .success-icon {
              text-align: center;
              font-size: 60px;
              margin: 20px 0;
            }
            .info-box {
              background-color: #f8f9fa;
              border-left: 4px solid #667eea;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .info-box strong {
              color: #667eea;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .footer p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Smart LMS</h1>
            </div>
            <div class="content">
              <div class="success-icon">✅</div>
              <h2 style="color: #333; text-align: center;">Account Verified Successfully!</h2>
              
              <p>Dear <strong>${user.firstName} ${user.lastName}</strong>,</p>
              
              <p>Great news! Your Smart LMS account has been verified and approved by our administrator.</p>
              
              <div class="info-box">
                <p><strong>Account Details:</strong></p>
                <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                ${user.studentId ? `<p><strong>Student ID:</strong> ${user.studentId}</p>` : ''}
                ${user.teacherId ? `<p><strong>Teacher ID:</strong> ${user.teacherId}</p>` : ''}
                ${user.employeeId ? `<p><strong>Employee ID:</strong> ${user.employeeId}</p>` : ''}
              </div>
              
              <p>You can now log in and access all the features of Smart LMS platform:</p>
              
              <ul>
                ${user.role === 'student' ? `
                  <li>View your courses and modules</li>
                  <li>Submit assignments</li>
                  <li>Track your attendance</li>
                  <li>Access learning materials</li>
                  <li>Monitor your progress</li>
                ` : `
                  <li>Manage your courses</li>
                  <li>Create and grade assignments</li>
                  <li>Track student attendance</li>
                  <li>Upload learning materials</li>
                  <li>Monitor student progress</li>
                `}
              </ul>
              
              <div style="text-align: center;">
                <p>Ready to get started?</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/login" class="button">
                  Login to Smart LMS
                </a>
              </div>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                If you have any questions or need assistance, please don't hesitate to contact our support team.
              </p>
            </div>
            <div class="footer">
              <p><strong>Smart LMS - Learning Made Simple</strong></p>
              <p>This is an automated message, please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} Smart LMS. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ [EMAIL] Verification email sent successfully:', {
      to: user.email,
      messageId: info.messageId,
      response: info.response
    });

    return {
      success: true,
      messageId: info.messageId,
      message: 'Verification email sent successfully'
    };

  } catch (error) {
    console.error('❌ [EMAIL] Failed to send verification email:', error);
    throw error;
  }
};

/**
 * Send account rejection email
 * @param {Object} user - User object containing email, firstName, lastName, role
 * @param {String} reason - Reason for rejection (optional)
 * @returns {Promise<Object>} - Email sending result
 */
const sendRejectionEmail = async (user, reason = '') => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'Smart LMS',
        address: process.env.EMAIL_USER || 'noreply.smartlms@gmail.com'
      },
      to: user.email,
      subject: '❌ Smart LMS Account Registration Update',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
              color: #ffffff;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px 20px;
            }
            .warning-icon {
              text-align: center;
              font-size: 60px;
              margin: 20px 0;
            }
            .info-box {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .footer p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Smart LMS</h1>
            </div>
            <div class="content">
              <div class="warning-icon">❌</div>
              <h2 style="color: #333; text-align: center;">Account Registration Update</h2>
              
              <p>Dear <strong>${user.firstName} ${user.lastName}</strong>,</p>
              
              <p>Thank you for your interest in Smart LMS. After reviewing your registration, we regret to inform you that your account application has not been approved at this time.</p>
              
              ${reason ? `
              <div class="info-box">
                <p><strong>Reason:</strong></p>
                <p>${reason}</p>
              </div>
              ` : ''}
              
              <p>If you believe this was a mistake or would like to discuss this decision, please contact our support team with your registration details:</p>
              
              <ul>
                <li><strong>Name:</strong> ${user.firstName} ${user.lastName}</li>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</li>
              </ul>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                We appreciate your understanding and encourage you to reach out if you have any questions.
              </p>
            </div>
            <div class="footer">
              <p><strong>Smart LMS - Learning Made Simple</strong></p>
              <p>This is an automated message, please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} Smart LMS. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ [EMAIL] Rejection email sent successfully:', {
      to: user.email,
      messageId: info.messageId,
      response: info.response
    });

    return {
      success: true,
      messageId: info.messageId,
      message: 'Rejection email sent successfully'
    };

  } catch (error) {
    console.error('❌ [EMAIL] Failed to send rejection email:', error);
    throw error;
  }
};

/**
 * Send welcome email on registration
 * @param {Object} user - User object containing email, firstName, lastName, role
 * @returns {Promise<Object>} - Email sending result
 */
const sendWelcomeEmail = async (user) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'Smart LMS',
        address: process.env.EMAIL_USER || 'noreply.smartlms@gmail.com'
      },
      to: user.email,
      subject: '🎓 Welcome to Smart LMS - Registration Received',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px 20px;
            }
            .welcome-icon {
              text-align: center;
              font-size: 60px;
              margin: 20px 0;
            }
            .info-box {
              background-color: #e7f3ff;
              border-left: 4px solid #2196F3;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .footer p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Smart LMS</h1>
            </div>
            <div class="content">
              <div class="welcome-icon">👋</div>
              <h2 style="color: #333; text-align: center;">Welcome to Smart LMS!</h2>
              
              <p>Dear <strong>${user.firstName} ${user.lastName}</strong>,</p>
              
              <p>Thank you for registering with Smart LMS! We have received your registration request.</p>
              
              <div class="info-box">
                <p><strong>📋 Your Registration Details:</strong></p>
                <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                ${user.studentId ? `<p><strong>Student ID:</strong> ${user.studentId}</p>` : ''}
                ${user.teacherId ? `<p><strong>Teacher ID:</strong> ${user.teacherId}</p>` : ''}
                ${user.employeeId ? `<p><strong>Employee ID:</strong> ${user.employeeId}</p>` : ''}
              </div>
              
              <p><strong>⏳ What's Next?</strong></p>
              <p>Your account is currently pending approval from our administrator. You will receive another email once your account has been verified and approved.</p>
              
              <p>This usually takes 1-2 business days. We appreciate your patience!</p>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                If you have any questions in the meantime, feel free to contact our support team.
              </p>
            </div>
            <div class="footer">
              <p><strong>Smart LMS - Learning Made Simple</strong></p>
              <p>This is an automated message, please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} Smart LMS. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ [EMAIL] Welcome email sent successfully:', {
      to: user.email,
      messageId: info.messageId,
      response: info.response
    });

    return {
      success: true,
      messageId: info.messageId,
      message: 'Welcome email sent successfully'
    };

  } catch (error) {
    console.error('❌ [EMAIL] Failed to send welcome email:', error);
    // Don't throw error for welcome email - it's not critical
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send subject assignment email to lecturer
 * @param {Object} lecturer - Lecturer user object
 * @param {Object} subject - Subject object with populated fields
 * @returns {Promise<Object>} - Email sending result
 */
const sendSubjectAssignmentEmailToLecturer = async (lecturer, subject) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'Smart LMS',
        address: process.env.EMAIL_USER || 'noreply.smartlms@gmail.com'
      },
      to: lecturer.email,
      subject: '📚 New Subject Assigned to You - Smart LMS',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px 20px;
            }
            .subject-icon {
              text-align: center;
              font-size: 60px;
              margin: 20px 0;
            }
            .info-box {
              background-color: #f8f9fa;
              border-left: 4px solid #667eea;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .info-box strong {
              color: #667eea;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e9ecef;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .footer p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Smart LMS</h1>
            </div>
            <div class="content">
              <div class="subject-icon">📚</div>
              <h2 style="color: #333; text-align: center;">New Subject Assigned!</h2>
              
              <p>Dear <strong>${lecturer.firstName} ${lecturer.lastName}</strong>,</p>
              
              <p>A new subject has been assigned to you. You can now manage this subject and create modules, assignments, and meetings.</p>
              
              <div class="info-box">
                <p><strong>📋 Subject Details:</strong></p>
                <div class="info-row">
                  <span><strong>Subject Name:</strong></span>
                  <span>${subject.name}</span>
                </div>
                <div class="info-row">
                  <span><strong>Subject Code:</strong></span>
                  <span>${subject.code}</span>
                </div>
                <div class="info-row">
                  <span><strong>Credit Hours:</strong></span>
                  <span>${subject.creditHours}</span>
                </div>
                <div class="info-row">
                  <span><strong>Department:</strong></span>
                  <span>${subject.departmentId?.name || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span><strong>Course:</strong></span>
                  <span>${subject.courseId?.name || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span><strong>Batch:</strong></span>
                  <span>${subject.batchId?.name || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span><strong>Semester:</strong></span>
                  <span>${subject.semesterId?.name || 'N/A'}</span>
                </div>
                ${subject.description ? `
                <div style="margin-top: 15px;">
                  <strong>Description:</strong>
                  <p style="margin: 5px 0;">${subject.description}</p>
                </div>
                ` : ''}
              </div>
              
              <p><strong>🎯 What You Can Do:</strong></p>
              <ul>
                <li>Create and manage modules for this subject</li>
                <li>Upload learning materials and resources</li>
                <li>Create assignments and grade submissions</li>
                <li>Schedule and conduct online meetings</li>
                <li>Track student attendance and progress</li>
              </ul>
              
              <div style="text-align: center;">
                <p>Ready to get started?</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/lecturer/subjects" class="button">
                  View Subject
                </a>
              </div>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                If you have any questions, please contact the administrator or support team.
              </p>
            </div>
            <div class="footer">
              <p><strong>Smart LMS - Learning Made Simple</strong></p>
              <p>This is an automated message, please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} Smart LMS. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ [EMAIL] Subject assignment email sent to lecturer:', {
      to: lecturer.email,
      subject: subject.name,
      messageId: info.messageId
    });

    return {
      success: true,
      messageId: info.messageId,
      message: 'Subject assignment email sent successfully'
    };

  } catch (error) {
    console.error('❌ [EMAIL] Failed to send subject assignment email to lecturer:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send subject enrollment email to student
 * @param {Object} student - Student user object
 * @param {Object} subject - Subject object with populated fields
 * @returns {Promise<Object>} - Email sending result
 */
const sendSubjectEnrollmentEmailToStudent = async (student, subject) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'Smart LMS',
        address: process.env.EMAIL_USER || 'noreply.smartlms@gmail.com'
      },
      to: student.email,
      subject: '📚 New Subject Available - Smart LMS',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px 20px;
            }
            .subject-icon {
              text-align: center;
              font-size: 60px;
              margin: 20px 0;
            }
            .info-box {
              background-color: #f8f9fa;
              border-left: 4px solid #667eea;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .info-box strong {
              color: #667eea;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e9ecef;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .footer p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Smart LMS</h1>
            </div>
            <div class="content">
              <div class="subject-icon">📚</div>
              <h2 style="color: #333; text-align: center;">New Subject Available!</h2>
              
              <p>Dear <strong>${student.firstName} ${student.lastName}</strong>,</p>
              
              <p>Great news! A new subject has been added to your curriculum. You can now access learning materials, assignments, and attend online meetings for this subject.</p>
              
              <div class="info-box">
                <p><strong>📋 Subject Details:</strong></p>
                <div class="info-row">
                  <span><strong>Subject Name:</strong></span>
                  <span>${subject.name}</span>
                </div>
                <div class="info-row">
                  <span><strong>Subject Code:</strong></span>
                  <span>${subject.code}</span>
                </div>
                <div class="info-row">
                  <span><strong>Credit Hours:</strong></span>
                  <span>${subject.creditHours}</span>
                </div>
                <div class="info-row">
                  <span><strong>Lecturer:</strong></span>
                  <span>${subject.lecturerId?.firstName || ''} ${subject.lecturerId?.lastName || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span><strong>Semester:</strong></span>
                  <span>${subject.semesterId?.name || 'N/A'}</span>
                </div>
                ${subject.description ? `
                <div style="margin-top: 15px;">
                  <strong>Description:</strong>
                  <p style="margin: 5px 0;">${subject.description}</p>
                </div>
                ` : ''}
              </div>
              
              <p><strong>🎯 What's Available:</strong></p>
              <ul>
                <li>Access learning modules and materials</li>
                <li>View and complete assignments</li>
                <li>Attend online meetings and lectures</li>
                <li>Track your attendance and progress</li>
                <li>Communicate with your lecturer</li>
              </ul>
              
              <div style="text-align: center;">
                <p>Ready to start learning?</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/student/subjects" class="button">
                  View Subject
                </a>
              </div>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Make sure to check regularly for new materials, assignments, and announcements.
              </p>
            </div>
            <div class="footer">
              <p><strong>Smart LMS - Learning Made Simple</strong></p>
              <p>This is an automated message, please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} Smart LMS. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ [EMAIL] Subject enrollment email sent to student:', {
      to: student.email,
      subject: subject.name,
      messageId: info.messageId
    });

    return {
      success: true,
      messageId: info.messageId,
      message: 'Subject enrollment email sent successfully'
    };

  } catch (error) {
    console.error('❌ [EMAIL] Failed to send subject enrollment email to student:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendVerificationEmail,
  sendRejectionEmail,
  sendWelcomeEmail,
  sendSubjectAssignmentEmailToLecturer,
  sendSubjectEnrollmentEmailToStudent
};
