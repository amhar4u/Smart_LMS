/**
 * Test script to verify socket attendance tracking
 * Run this while the backend server is running to test the join-meeting event
 */

const io = require('socket.io-client');

const BACKEND_URL = 'http://localhost:4200';
const TEST_MEETING_ID = '693f9d9e1767cd0fba09787c'; // From the screenshot
const TEST_STUDENT_ID = '60d5ec49f1b2c72b8c8e4567'; // Replace with actual student ID
const TEST_STUDENT_NAME = 'Test Student';

console.log('🧪 Starting Attendance Socket Test');
console.log('='.repeat(80));
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Meeting ID: ${TEST_MEETING_ID}`);
console.log(`Student ID: ${TEST_STUDENT_ID}`);
console.log(`Student Name: ${TEST_STUDENT_NAME}`);
console.log('='.repeat(80) + '\n');

// Create socket connection
const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true
});

let attendanceRecorded = false;
let attendanceError = false;

// Connection events
socket.on('connect', () => {
  console.log('✅ Socket connected');
  console.log(`   Socket ID: ${socket.id}\n`);
  
  // Wait a moment to ensure connection is stable
  setTimeout(() => {
    console.log('📡 Emitting join-meeting event...');
    socket.emit('join-meeting', {
      meetingId: TEST_MEETING_ID,
      studentId: TEST_STUDENT_ID,
      studentName: TEST_STUDENT_NAME
    });
    console.log('✅ Event emitted, waiting for response...\n');
  }, 1000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

socket.on('disconnect', () => {
  console.log('⚠️  Socket disconnected');
});

// Attendance events
socket.on('attendance-recorded', (data) => {
  console.log('✅ ATTENDANCE RECORDED EVENT RECEIVED');
  console.log('='.repeat(80));
  console.log(JSON.stringify(data, null, 2));
  console.log('='.repeat(80) + '\n');
  attendanceRecorded = true;
  
  setTimeout(() => {
    console.log('\n✅ Test completed successfully!');
    console.log('   Attendance was recorded properly.');
    process.exit(0);
  }, 1000);
});

socket.on('attendance-error', (data) => {
  console.error('❌ ATTENDANCE ERROR EVENT RECEIVED');
  console.error('='.repeat(80));
  console.error(JSON.stringify(data, null, 2));
  console.error('='.repeat(80) + '\n');
  attendanceError = true;
  
  setTimeout(() => {
    console.error('\n❌ Test failed!');
    console.error('   Attendance recording error.');
    process.exit(1);
  }, 1000);
});

socket.on('student-joined', (data) => {
  console.log('📢 STUDENT-JOINED EVENT RECEIVED (broadcasted to room)');
  console.log(JSON.stringify(data, null, 2) + '\n');
});

// Timeout after 15 seconds
setTimeout(() => {
  if (!attendanceRecorded && !attendanceError) {
    console.error('\n❌ Test timeout!');
    console.error('   No attendance confirmation received within 15 seconds.');
    console.error('\n🔍 Possible issues:');
    console.error('   1. Backend server not running');
    console.error('   2. Socket connection failed');
    console.error('   3. Meeting ID or Student ID invalid');
    console.error('   4. Database connection issues');
    console.error('   5. Backend code error (check server logs)');
    process.exit(1);
  }
}, 15000);
