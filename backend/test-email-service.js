/**
 * Test Email Service
 * This script tests the email sending functionality
 */

require('dotenv').config();
const { sendVerificationEmail, sendRejectionEmail, sendWelcomeEmail } = require('./services/emailService');

// Test user data
const testStudent = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'test@example.com', // Replace with your test email
  role: 'student',
  studentId: 'STU20241234'
};

const testTeacher = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'test@example.com', // Replace with your test email
  role: 'teacher',
  teacherId: 'TCH20245678',
  employeeId: 'EMP001'
};

async function testEmails() {
  console.log('🚀 Starting Email Service Tests...\n');

  try {
    // Test 1: Welcome Email
    console.log('📧 Test 1: Sending Welcome Email...');
    const welcomeResult = await sendWelcomeEmail(testStudent);
    console.log('✅ Welcome Email Result:', welcomeResult);
    console.log('');

    // Wait a bit between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Verification Email
    console.log('📧 Test 2: Sending Verification Email...');
    const verificationResult = await sendVerificationEmail(testTeacher);
    console.log('✅ Verification Email Result:', verificationResult);
    console.log('');

    // Wait a bit between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Rejection Email
    console.log('📧 Test 3: Sending Rejection Email...');
    const rejectionResult = await sendRejectionEmail(testStudent, 'Invalid credentials provided during registration.');
    console.log('✅ Rejection Email Result:', rejectionResult);
    console.log('');

    console.log('✅ All email tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Welcome Email: ' + (welcomeResult.success ? '✅ Sent' : '❌ Failed'));
    console.log('- Verification Email: ' + (verificationResult.success ? '✅ Sent' : '❌ Failed'));
    console.log('- Rejection Email: ' + (rejectionResult.success ? '✅ Sent' : '❌ Failed'));

  } catch (error) {
    console.error('❌ Email test failed:', error);
    process.exit(1);
  }
}

// Run tests
testEmails();
