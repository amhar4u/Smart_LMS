/**
 * Test script for subject email notifications
 * This script tests the email sending functionality for subject assignments
 */

require('dotenv').config();
const { 
  sendSubjectAssignmentEmailToLecturer, 
  sendSubjectEnrollmentEmailToStudent 
} = require('./services/emailService');

// Test data
const testLecturer = {
  firstName: 'John',
  lastName: 'Doe',
  email: process.env.TEST_LECTURER_EMAIL || 'lecturer@test.com'
};

const testStudent = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: process.env.TEST_STUDENT_EMAIL || 'student@test.com'
};

const testSubject = {
  name: 'Introduction to Computer Science',
  code: 'CS101',
  creditHours: 3,
  description: 'This course covers the fundamentals of computer science including programming, data structures, and algorithms.',
  departmentId: {
    name: 'Computer Science',
    code: 'CS'
  },
  courseId: {
    name: 'Bachelor of Science in Computer Science',
    code: 'BSCS'
  },
  batchId: {
    name: 'Batch 2024',
    code: 'B2024'
  },
  semesterId: {
    name: 'Semester 1',
    code: 'SEM1'
  },
  lecturerId: {
    firstName: 'John',
    lastName: 'Doe'
  }
};

async function testEmails() {
  console.log('🧪 Testing Subject Email Notifications...\n');

  try {
    // Test lecturer email
    console.log('📧 Testing lecturer assignment email...');
    const lecturerResult = await sendSubjectAssignmentEmailToLecturer(testLecturer, testSubject);
    
    if (lecturerResult.success) {
      console.log('✅ Lecturer email sent successfully!');
      console.log('   Message ID:', lecturerResult.messageId);
    } else {
      console.log('❌ Failed to send lecturer email:', lecturerResult.error);
    }

    console.log('\n---\n');

    // Test student email
    console.log('📧 Testing student enrollment email...');
    const studentResult = await sendSubjectEnrollmentEmailToStudent(testStudent, testSubject);
    
    if (studentResult.success) {
      console.log('✅ Student email sent successfully!');
      console.log('   Message ID:', studentResult.messageId);
    } else {
      console.log('❌ Failed to send student email:', studentResult.error);
    }

    console.log('\n✅ Email test completed!');
    console.log('\n📝 Note: Check the email addresses configured in your .env file:');
    console.log('   TEST_LECTURER_EMAIL:', process.env.TEST_LECTURER_EMAIL || 'Not set');
    console.log('   TEST_STUDENT_EMAIL:', process.env.TEST_STUDENT_EMAIL || 'Not set');
    console.log('   EMAIL_USER:', process.env.EMAIL_USER || 'Not set');
    
  } catch (error) {
    console.error('❌ Error during email test:', error);
  }
}

// Run the test
testEmails();
