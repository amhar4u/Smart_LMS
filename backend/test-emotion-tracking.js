const io = require('socket.io-client');

console.log('🧪 Testing Socket.IO Connection to Smart LMS Backend...\n');

const socket = io('http://192.168.8.168:3000', {
  transports: ['websocket', 'polling'],
  reconnection: true
});

socket.on('connect', () => {
  console.log('✅ Socket.IO connected successfully!');
  console.log('📍 Socket ID:', socket.id);
  console.log('');
  
  // Test join-meeting event
  console.log('📡 Testing join-meeting event...');
  socket.emit('join-meeting', {
    meetingId: 'test-meeting-123',
    studentId: 'test-student-456',
    studentName: 'Test Student'
  });
  
  console.log('✅ join-meeting event sent');
  console.log('');
  
  // Test emotion-update event after 2 seconds
  setTimeout(() => {
    console.log('📡 Testing emotion-update event...');
    socket.emit('emotion-update', {
      meetingId: 'test-meeting-123',
      studentId: 'test-student-456',
      emotions: {
        happy: 0.75,
        sad: 0.05,
        angry: 0.02,
        surprised: 0.03,
        fearful: 0.01,
        disgusted: 0.01,
        neutral: 0.13
      },
      dominantEmotion: 'happy',
      faceDetected: true,
      confidence: 0.92,
      sessionId: 'test-session-789',
      timestamp: new Date()
    });
    
    console.log('✅ emotion-update event sent');
    console.log('');
    console.log('👀 Check backend console for:');
    console.log('   - "Client connected" message');
    console.log('   - "Student Test Student joined meeting" message');
    console.log('   - "EMOTION TRACKING DATA RECEIVED" with full details');
    console.log('');
  }, 2000);
  
  // Test another emotion update after 5 seconds
  setTimeout(() => {
    console.log('📡 Sending another emotion-update...');
    socket.emit('emotion-update', {
      meetingId: 'test-meeting-123',
      studentId: 'test-student-456',
      emotions: {
        happy: 0.45,
        sad: 0.35,
        angry: 0.05,
        surprised: 0.02,
        fearful: 0.01,
        disgusted: 0.01,
        neutral: 0.11
      },
      dominantEmotion: 'happy',
      faceDetected: true,
      confidence: 0.88,
      sessionId: 'test-session-789',
      timestamp: new Date()
    });
    
    console.log('✅ Second emotion-update sent');
    console.log('');
  }, 5000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.error('');
  console.error('💡 Troubleshooting:');
  console.error('   1. Is backend server running? (node server.js)');
  console.error('   2. Is it listening on port 3000?');
  console.error('   3. Is MongoDB connected?');
  console.error('   4. Check firewall settings');
  console.error('');
});

socket.on('disconnect', () => {
  console.log('🔌 Disconnected from server');
});

socket.on('attendance-recorded', (data) => {
  console.log('📝 Attendance confirmation received:', data);
});

socket.on('error', (data) => {
  console.error('❌ Server error:', data);
});

// Keep alive for 10 seconds then exit
setTimeout(() => {
  console.log('');
  console.log('============================================');
  console.log('✅ Test Complete!');
  console.log('============================================');
  console.log('');
  console.log('If you saw:');
  console.log('  ✅ Socket.IO connected');
  console.log('  ✅ join-meeting event sent');
  console.log('  ✅ emotion-update event sent');
  console.log('');
  console.log('AND in backend console:');
  console.log('  ✅ Client connected');
  console.log('  ✅ Student joined meeting');
  console.log('  ✅ EMOTION TRACKING DATA RECEIVED');
  console.log('');
  console.log('Then Socket.IO is working correctly!');
  console.log('The issue is in the frontend not connecting.');
  console.log('');
  console.log('Solution: Rebuild frontend and clear cache.');
  console.log('============================================');
  console.log('');
  
  socket.disconnect();
  process.exit(0);
}, 10000);
