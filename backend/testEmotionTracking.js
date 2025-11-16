/**
 * Emotion Tracking Test Script
 * 
 * This script simulates emotion tracking for a 5-minute video session
 * Sends emotion updates every minute to test the logging system
 */

const io = require('socket.io-client');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const MEETING_ID = '507f1f77bcf86cd799439011'; // Replace with actual meeting ID
const STUDENT_ID = '507f1f77bcf86cd799439012'; // Replace with actual student ID
const SESSION_ID = `test-session-${Date.now()}`;
const UPDATE_INTERVAL = 60000; // 1 minute in milliseconds
const TOTAL_DURATION = 5 * 60 * 1000; // 5 minutes

console.log('\n' + '🧪'.repeat(40));
console.log('🧪 EMOTION TRACKING TEST SCRIPT');
console.log('🧪'.repeat(40));
console.log(`📡 Server URL: ${SERVER_URL}`);
console.log(`📍 Meeting ID: ${MEETING_ID}`);
console.log(`👤 Student ID: ${STUDENT_ID}`);
console.log(`🔑 Session ID: ${SESSION_ID}`);
console.log(`⏱️  Update Interval: ${UPDATE_INTERVAL / 1000} seconds`);
console.log(`⏳ Total Duration: ${TOTAL_DURATION / 1000} seconds (${TOTAL_DURATION / 60000} minutes)`);
console.log('🧪'.repeat(40) + '\n');

// Connect to Socket.IO
const socket = io(SERVER_URL, {
  transports: ['websocket'],
  reconnection: true
});

let updateCount = 0;
let testInterval;

// Sample emotion data sets (simulating different emotional states)
const emotionSets = [
  {
    name: 'Happy & Engaged',
    emotions: { happy: 0.85, sad: 0.05, angry: 0.02, surprised: 0.03, fearful: 0.01, disgusted: 0.01, neutral: 0.03 },
    dominantEmotion: 'happy',
    faceDetected: true,
    confidence: 0.92
  },
  {
    name: 'Neutral & Attentive',
    emotions: { happy: 0.15, sad: 0.05, angry: 0.02, surprised: 0.05, fearful: 0.01, disgusted: 0.01, neutral: 0.71 },
    dominantEmotion: 'neutral',
    faceDetected: true,
    confidence: 0.88
  },
  {
    name: 'Confused (Surprised)',
    emotions: { happy: 0.10, sad: 0.05, angry: 0.02, surprised: 0.65, fearful: 0.03, disgusted: 0.01, neutral: 0.14 },
    dominantEmotion: 'surprised',
    faceDetected: true,
    confidence: 0.85
  },
  {
    name: 'Sad & Disengaged',
    emotions: { happy: 0.05, sad: 0.72, angry: 0.08, surprised: 0.02, fearful: 0.05, disgusted: 0.02, neutral: 0.06 },
    dominantEmotion: 'sad',
    faceDetected: true,
    confidence: 0.78
  },
  {
    name: 'Low Attention (Face Away)',
    emotions: { happy: 0.10, sad: 0.05, angry: 0.02, surprised: 0.05, fearful: 0.01, disgusted: 0.01, neutral: 0.76 },
    dominantEmotion: 'neutral',
    faceDetected: false,
    confidence: 0.25
  }
];

socket.on('connect', () => {
  console.log('✅ Connected to server');
  console.log(`🔌 Socket ID: ${socket.id}\n`);
  
  // Start sending emotion updates
  startEmotionTracking();
});

socket.on('disconnect', () => {
  console.log('\n❌ Disconnected from server');
  clearInterval(testInterval);
});

socket.on('error', (error) => {
  console.error('\n❌ Socket error:', error);
});

socket.on('student-emotion-live', (data) => {
  console.log('\n📥 Received broadcast acknowledgment');
  console.log('   Data:', JSON.stringify(data, null, 2));
});

socket.on('emotion-alert', (alert) => {
  console.log('\n🚨 ALERT RECEIVED:');
  console.log('   Type:', alert.type);
  console.log('   Details:', JSON.stringify(alert, null, 2));
});

function startEmotionTracking() {
  console.log('🎬 Starting emotion tracking test...\n');
  
  // Send initial emotion update
  sendEmotionUpdate();
  
  // Set up interval for periodic updates
  testInterval = setInterval(() => {
    sendEmotionUpdate();
    
    // Stop after 5 minutes
    if (updateCount >= 5) {
      console.log('\n' + '✅'.repeat(40));
      console.log('✅ 5-MINUTE TEST COMPLETED');
      console.log('✅'.repeat(40));
      console.log(`📊 Total Updates Sent: ${updateCount}`);
      console.log(`⏱️  Duration: ${TOTAL_DURATION / 1000} seconds`);
      console.log('✅'.repeat(40) + '\n');
      
      clearInterval(testInterval);
      socket.disconnect();
      process.exit(0);
    }
  }, UPDATE_INTERVAL);
}

function sendEmotionUpdate() {
  updateCount++;
  
  // Select emotion set (cycle through them)
  const emotionSet = emotionSets[(updateCount - 1) % emotionSets.length];
  
  const emotionData = {
    meetingId: MEETING_ID,
    studentId: STUDENT_ID,
    sessionId: SESSION_ID,
    emotions: emotionSet.emotions,
    dominantEmotion: emotionSet.dominantEmotion,
    faceDetected: emotionSet.faceDetected,
    confidence: emotionSet.confidence
  };
  
  console.log('📤'.repeat(40));
  console.log(`📤 SENDING EMOTION UPDATE #${updateCount}/5`);
  console.log('📤'.repeat(40));
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);
  console.log(`🎭 Emotion Set: ${emotionSet.name}`);
  console.log(`😊 Dominant: ${emotionSet.dominantEmotion}`);
  console.log(`👁️  Face Detected: ${emotionSet.faceDetected ? 'Yes' : 'No'}`);
  console.log(`📊 Confidence: ${(emotionSet.confidence * 100).toFixed(2)}%`);
  console.log('📤'.repeat(40) + '\n');
  
  socket.emit('emotion-update', emotionData);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted by user');
  clearInterval(testInterval);
  socket.disconnect();
  process.exit(0);
});
