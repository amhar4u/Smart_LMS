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

/**
 * Send assignment creation notification email
 * @param {Object} recipient - User object (student or lecturer)
 * @param {Object} assignment - Assignment object with populated fields
 * @param {String} role - Recipient role ('student' or 'lecturer')
 * @returns {Promise<Object>} - Email sending result
 */
const sendAssignmentNotification = async (recipient, assignment, role = 'student') => {
  try {
    const transporter = createTransporter();
    
    const dueDate = new Date(assignment.dueDate).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const mailOptions = {
      from: {
        name: 'Smart LMS',
        address: process.env.EMAIL_USER || 'noreply.smartlms@gmail.com'
      },
      to: recipient.email,
      subject: `📝 New Assignment: ${assignment.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px 20px; }
            .icon { text-align: center; font-size: 60px; margin: 20px 0; }
            .info-box { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
            .info-row:last-child { border-bottom: none; }
            .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .due-date { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>🎓 Smart LMS</h1></div>
            <div class="content">
              <div class="icon">📝</div>
              <h2 style="color: #333; text-align: center;">New Assignment ${role === 'lecturer' ? 'Created' : 'Available'}!</h2>
              <p>Dear <strong>${recipient.firstName} ${recipient.lastName}</strong>,</p>
              <p>${role === 'lecturer' ? 'You have successfully created a new assignment.' : 'A new assignment has been posted for your subject.'}</p>
              <div class="info-box">
                <p><strong>📋 Assignment Details:</strong></p>
                <div class="info-row"><span><strong>Title:</strong></span><span>${assignment.title}</span></div>
                <div class="info-row"><span><strong>Subject:</strong></span><span>${assignment.subject?.name || 'N/A'}</span></div>
                <div class="info-row"><span><strong>Type:</strong></span><span>${assignment.assignmentType || 'N/A'}</span></div>
                <div class="info-row"><span><strong>Total Marks:</strong></span><span>${assignment.totalMarks || 'N/A'}</span></div>
                <div class="info-row"><span><strong>Questions:</strong></span><span>${assignment.questionCount || 0}</span></div>
                ${assignment.description ? `<div style="margin-top: 15px;"><strong>Description:</strong><p style="margin: 5px 0;">${assignment.description}</p></div>` : ''}
              </div>
              <div class="due-date">⏰ Due Date: ${dueDate}</div>
              ${role === 'student' ? `
                <p><strong>📌 What to do:</strong></p>
                <ul>
                  <li>Review the assignment requirements carefully</li>
                  <li>Complete and submit before the due date</li>
                  <li>Check for any attachments or additional resources</li>
                </ul>
              ` : ''}
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/${role === 'lecturer' ? 'lecturer' : 'student'}/assignments" class="button">View Assignment</a>
              </div>
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
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [EMAIL] Failed to send assignment notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send meeting notification email
 * @param {Object} recipient - User object (student or lecturer)
 * @param {Object} meeting - Meeting object with populated fields
 * @param {String} role - Recipient role ('student' or 'lecturer')
 * @returns {Promise<Object>} - Email sending result
 */
const sendMeetingNotification = async (recipient, meeting, role = 'student') => {
  try {
    const transporter = createTransporter();
    
    const meetingDate = new Date(meeting.startTime).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const mailOptions = {
      from: {
        name: 'Smart LMS',
        address: process.env.EMAIL_USER || 'noreply.smartlms@gmail.com'
      },
      to: recipient.email,
      subject: `📹 New Meeting Scheduled: ${meeting.topic}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px 20px; }
            .icon { text-align: center; font-size: 60px; margin: 20px 0; }
            .info-box { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
            .info-row:last-child { border-bottom: none; }
            .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .meeting-time { background-color: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 4px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>🎓 Smart LMS</h1></div>
            <div class="content">
              <div class="icon">📹</div>
              <h2 style="color: #333; text-align: center;">New Meeting Scheduled!</h2>
              <p>Dear <strong>${recipient.firstName} ${recipient.lastName}</strong>,</p>
              <p>${role === 'lecturer' ? 'You have successfully scheduled a new meeting.' : 'A new online meeting has been scheduled for your subject.'}</p>
              <div class="info-box">
                <p><strong>📋 Meeting Details:</strong></p>
                <div class="info-row"><span><strong>Topic:</strong></span><span>${meeting.topic}</span></div>
                <div class="info-row"><span><strong>Subject:</strong></span><span>${meeting.subjectId?.name || 'N/A'}</span></div>
                <div class="info-row"><span><strong>Duration:</strong></span><span>${meeting.duration || 'N/A'} minutes</span></div>
                ${meeting.description ? `<div style="margin-top: 15px;"><strong>Description:</strong><p style="margin: 5px 0;">${meeting.description}</p></div>` : ''}
              </div>
              <div class="meeting-time">📅 Scheduled: ${meetingDate}</div>
              ${role === 'student' ? `
                <p><strong>📌 Important:</strong></p>
                <ul>
                  <li>Join the meeting on time</li>
                  <li>Prepare any materials needed</li>
                  <li>Test your camera and microphone beforehand</li>
                </ul>
              ` : ''}
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/${role === 'lecturer' ? 'lecturer' : 'student'}/meetings" class="button">View Meetings</a>
              </div>
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
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [EMAIL] Failed to send meeting notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send module creation notification email
 * @param {Object} recipient - User object (student or lecturer)
 * @param {Object} module - Module object with populated fields
 * @param {String} role - Recipient role ('student' or 'lecturer')
 * @returns {Promise<Object>} - Email sending result
 */
const sendModuleNotification = async (recipient, module, role = 'student') => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'Smart LMS',
        address: process.env.EMAIL_USER || 'noreply.smartlms@gmail.com'
      },
      to: recipient.email,
      subject: `📚 New Module: ${module.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px 20px; }
            .icon { text-align: center; font-size: 60px; margin: 20px 0; }
            .info-box { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
            .info-row:last-child { border-bottom: none; }
            .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>🎓 Smart LMS</h1></div>
            <div class="content">
              <div class="icon">📚</div>
              <h2 style="color: #333; text-align: center;">New Learning Module Available!</h2>
              <p>Dear <strong>${recipient.firstName} ${recipient.lastName}</strong>,</p>
              <p>${role === 'lecturer' ? 'You have successfully created a new module.' : 'A new learning module has been added to your subject.'}</p>
              <div class="info-box">
                <p><strong>📋 Module Details:</strong></p>
                <div class="info-row"><span><strong>Module Name:</strong></span><span>${module.name}</span></div>
                <div class="info-row"><span><strong>Module Code:</strong></span><span>${module.code || 'N/A'}</span></div>
                <div class="info-row"><span><strong>Subject:</strong></span><span>${module.subjectId?.name || 'N/A'}</span></div>
                ${module.description ? `<div style="margin-top: 15px;"><strong>Description:</strong><p style="margin: 5px 0;">${module.description}</p></div>` : ''}
              </div>
              ${role === 'student' ? `
                <p><strong>📌 What's Inside:</strong></p>
                <ul>
                  <li>Learning materials and resources</li>
                  <li>Lecture notes and documents</li>
                  <li>Practice exercises</li>
                </ul>
              ` : ''}
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/${role === 'lecturer' ? 'lecturer' : 'student'}/modules" class="button">View Modules</a>
              </div>
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
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [EMAIL] Failed to send module notification:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail,
  sendRejectionEmail,
  sendWelcomeEmail,
  sendSubjectAssignmentEmailToLecturer,
  sendSubjectEnrollmentEmailToStudent,
  sendAssignmentNotification,
  sendMeetingNotification,
  sendModuleNotification
};
