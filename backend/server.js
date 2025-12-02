const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:4200', 
      'http://localhost:4201', 
      'http://localhost:4202',
      'http://192.168.8.168:4200',
      'http://192.168.8.168:4201',
      'http://192.168.8.168:4202',
      process.env.FRONTEND_URL // Production frontend URL
    ].filter(Boolean), // Remove undefined values
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Make io available to routes
app.set('io', io);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'smart-lms-secret-key-2024',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// CORS middleware
app.use(cors({
  origin: [
    'http://localhost:4200', 
    'http://localhost:4201', 
    'http://localhost:4202',
    'http://192.168.8.168:4200',
    'http://192.168.8.168:4201',
    'http://192.168.8.168:4202',
    process.env.FRONTEND_URL // Production frontend URL
  ].filter(Boolean), // Remove undefined values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/semesters', require('./routes/semesters'));
app.use('/api/batches', require('./routes/batches'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/modules', require('./routes/modules'));
app.use('/api/extra-modules', require('./routes/extraModules'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/lecturer', require('./routes/lecturer'));
app.use('/api/students', require('./routes/students'));
app.use('/api/student-subject-levels', require('./routes/studentSubjectLevels'));
app.use('/api/emotions', require('./routes/emotions'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/dependencies', require('./routes/dependencies'));
app.use('/api/analytics', require('./routes/analytics'));

// Emotion tracking configuration endpoint
app.get('/api/config/emotion-tracking', (req, res) => {
  const interval = parseInt(process.env.EMOTION_TRACKING_INTERVAL) || 60000; // Default 1 minute for debugging
  
  console.log('\n' + '⚙️'.repeat(40));
  console.log('⚙️  EMOTION TRACKING CONFIGURATION REQUEST');
  console.log('⚙️'.repeat(40));
  console.log(`📡 Client IP: ${req.ip}`);
  console.log(`⏱️  Tracking Interval: ${interval}ms (${interval / 1000}s)`);
  console.log(`✅ Tracking Enabled: true`);
  console.log('⚙️'.repeat(40) + '\n');
  
  res.json({
    interval: interval,
    enabled: true,
    debugMode: process.env.NODE_ENV === 'development'
  });
});

// Test route for auth
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Smart LMS Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection with TLS configuration
const mongoOptions = {
  tls: true,
  tlsAllowInvalidCertificates: true, // Temporary fix for development
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

mongoose.connect(process.env.MONGODB_URI, mongoOptions)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log('📦 Database:', mongoose.connection.db.databaseName);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Server will continue running without database functionality');
    console.log('🔧 To fix: Check MongoDB connection string or start local MongoDB');
  });

// Socket.IO connection handling
const StudentEmotion = require('./models/StudentEmotion');
const Meeting = require('./models/Meeting');
const Attendance = require('./models/Attendance');
const User = require('./models/User');

// Track emotion statistics per minute for debugging
const emotionStats = {
  totalRecorded: 0,
  faceDetected: 0,
  faceNotDetected: 0,
  emotionCounts: {
    happy: 0,
    sad: 0,
    angry: 0,
    surprised: 0,
    fearful: 0,
    disgusted: 0,
    neutral: 0
  },
  lastMinuteReset: Date.now()
};

// Reset and print per-minute statistics
setInterval(() => {
  if (emotionStats.totalRecorded > 0) {
    const now = new Date();
    console.log('\n' + '📊'.repeat(40));
    console.log('📊 PER-MINUTE EMOTION TRACKING SUMMARY');
    console.log('📊'.repeat(40));
    console.log(`⏰ Time: ${now.toLocaleString()}`);
    console.log(`📈 Total Records: ${emotionStats.totalRecorded}`);
    console.log(`👁️  Face Detected: ${emotionStats.faceDetected} (${((emotionStats.faceDetected / emotionStats.totalRecorded) * 100).toFixed(2)}%)`);
    console.log(`❌ Face Not Detected: ${emotionStats.faceNotDetected} (${((emotionStats.faceNotDetected / emotionStats.totalRecorded) * 100).toFixed(2)}%)`);
    console.log('-'.repeat(80));
    console.log('😊 EMOTION DISTRIBUTION:');
    Object.entries(emotionStats.emotionCounts).forEach(([emotion, count]) => {
      const percentage = ((count / emotionStats.totalRecorded) * 100).toFixed(2);
      const emoji = {
        happy: '😊',
        sad: '😢',
        angry: '😠',
        surprised: '😮',
        fearful: '😨',
        disgusted: '🤢',
        neutral: '😐'
      }[emotion] || '❓';
      console.log(`   ${emoji} ${emotion.padEnd(10)}: ${count.toString().padStart(4)} (${percentage.padStart(6)}%)`);
    });
    console.log('📊'.repeat(40) + '\n');
    
    // Reset stats for next minute
    emotionStats.totalRecorded = 0;
    emotionStats.faceDetected = 0;
    emotionStats.faceNotDetected = 0;
    Object.keys(emotionStats.emotionCounts).forEach(key => {
      emotionStats.emotionCounts[key] = 0;
    });
    emotionStats.lastMinuteReset = Date.now();
  }
}, 60000); // Every 60 seconds (1 minute)

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Student joins a meeting room
  socket.on('join-meeting', async (data) => {
    const { meetingId, studentId, studentName } = data;
    socket.join(`meeting-${meetingId}`);
    socket.join(`student-${studentId}`);
    
    console.log(`👤 Student ${studentName} (${studentId}) joined meeting ${meetingId}`);
    
    try {
      // Record attendance - student joined
      const student = await User.findById(studentId);
      if (student) {
        let attendance = await Attendance.findOne({ meetingId, studentId });
        
        if (!attendance) {
          attendance = new Attendance({
            meetingId,
            studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            studentEmail: student.email,
            sessions: []
          });
        }
        
        const joinTime = new Date();
        attendance.recordJoin(joinTime);
        
        // Check if late
        const meeting = await Meeting.findById(meetingId);
        if (meeting) {
          attendance.checkLateArrival(meeting.startTime, 5);
        }
        
        await attendance.save();
        
        console.log(`✅ Attendance recorded: ${studentName} joined at ${joinTime}`);
        
        // Notify lecturer with attendance details
        io.to(`meeting-${meetingId}`).emit('student-joined', {
          studentId,
          studentName,
          joinTime,
          sessionCount: attendance.sessions.length,
          isLate: attendance.isLate,
          status: attendance.status,
          timestamp: new Date()
        });
        
        // Send attendance confirmation to student
        socket.emit('attendance-recorded', {
          type: 'join',
          meetingId,
          joinTime,
          sessionNumber: attendance.sessions.length,
          isLate: attendance.isLate
        });
      }
    } catch (error) {
      console.error('Error recording attendance on join:', error);
      socket.emit('attendance-error', {
        message: 'Failed to record attendance'
      });
    }
  });

  // Receive emotion data from student
  socket.on('emotion-update', async (data) => {
    try {
      const { meetingId, studentId, studentName, emotions, dominantEmotion, faceDetected, confidence, sessionId } = data;
      
      // Get current time for logging
      const now = new Date();
      const timestamp = now.toLocaleString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      });
      
      // ============================================
      // 🎭 EMOTION TRACKING DEBUG - START
      // ============================================
      console.log('\n' + '='.repeat(80));
      console.log('🎭 EMOTION TRACKING DATA RECEIVED');
      console.log('='.repeat(80));
      console.log(`⏰ Timestamp: ${timestamp} (${now.toISOString()})`);
      console.log(`📍 Meeting ID: ${meetingId}`);
      console.log(`👤 Student ID: ${studentId}`);
      console.log(`🔑 Session ID: ${sessionId || 'N/A'}`);
      console.log('-'.repeat(80));
      
      // Log face detection status
      console.log('👁️  FACE DETECTION:');
      console.log(`   Status: ${faceDetected ? '✅ DETECTED' : '❌ NOT DETECTED'}`);
      console.log(`   Confidence: ${(confidence * 100).toFixed(2)}%`);
      console.log(`   Attentiveness Score: ${faceDetected ? (confidence * 100).toFixed(2) : '0.00'}%`);
      console.log('-'.repeat(80));
      
      // Log emotion values
      console.log('😊 EMOTION VALUES (0-100%):');
      console.log(`   😊 Happy:     ${(emotions.happy * 100).toFixed(2)}%`);
      console.log(`   😢 Sad:       ${(emotions.sad * 100).toFixed(2)}%`);
      console.log(`   😠 Angry:     ${(emotions.angry * 100).toFixed(2)}%`);
      console.log(`   😮 Surprised: ${(emotions.surprised * 100).toFixed(2)}%`);
      console.log(`   😨 Fearful:   ${(emotions.fearful * 100).toFixed(2)}%`);
      console.log(`   🤢 Disgusted: ${(emotions.disgusted * 100).toFixed(2)}%`);
      console.log(`   😐 Neutral:   ${(emotions.neutral * 100).toFixed(2)}%`);
      console.log('-'.repeat(80));
      
      // Log dominant emotion with color
      const emotionEmojis = {
        happy: '😊',
        sad: '😢',
        angry: '😠',
        surprised: '😮',
        fearful: '😨',
        disgusted: '🤢',
        neutral: '😐',
        unknown: '❓'
      };
      console.log('🎯 DOMINANT EMOTION:');
      console.log(`   ${emotionEmojis[dominantEmotion] || '❓'} ${dominantEmotion.toUpperCase()}`);
      
      // Save emotion data to database
      const emotionRecord = new StudentEmotion({
        meetingId,
        studentId,
        studentName: studentName || 'Student',
        emotions,
        dominantEmotion,
        faceDetected,
        detectionConfidence: confidence || 0,
        attentiveness: faceDetected ? confidence : 0,
        isPresent: true,
        sessionId
      });

      await emotionRecord.save();
      
      // Update per-minute statistics
      emotionStats.totalRecorded++;
      if (faceDetected) {
        emotionStats.faceDetected++;
      } else {
        emotionStats.faceNotDetected++;
      }
      emotionStats.emotionCounts[dominantEmotion]++;
      
      console.log('-'.repeat(80));
      console.log('💾 DATABASE:');
      console.log(`   ✅ Emotion record saved successfully`);
      console.log(`   🆔 Record ID: ${emotionRecord._id}`);
      console.log(`   📊 This minute: ${emotionStats.totalRecorded} records tracked`);
      console.log('-'.repeat(80));
      
      // Check for alerts
      const alerts = [];
      
      // Check for negative emotions
      if (emotions.sad > 0.6 || emotions.angry > 0.6 || emotions.fearful > 0.5) {
        const severity = emotions.sad > 0.7 || emotions.angry > 0.7 ? 'HIGH' : 'MEDIUM';
        const alertMsg = `⚠️  ALERT: Negative emotion detected (${dominantEmotion}: ${(emotions[dominantEmotion] * 100).toFixed(2)}%) - Severity: ${severity}`;
        alerts.push(alertMsg);
        
        io.to(`meeting-${meetingId}`).emit('emotion-alert', {
          type: 'negative-emotion',
          studentId,
          studentName: emotionRecord.studentName || 'Student',
          emotion: dominantEmotion,
          value: emotions[dominantEmotion],
          message: `${emotionRecord.studentName || 'Student'} is feeling ${dominantEmotion}`,
          severity: severity.toLowerCase(),
          timestamp: new Date()
        });
      }

      // Check for low attentiveness
      if (!faceDetected || confidence < 0.5) {
        const alertMsg = `⚠️  ALERT: Low attentiveness detected (${faceDetected ? 'Low confidence' : 'Face not detected'}: ${(confidence * 100).toFixed(2)}%)`;
        io.to(`meeting-${meetingId}`).emit('emotion-alert', {
          type: 'low-attentiveness',
          studentId,
          studentName: emotionRecord.studentName || 'Student',
          attentiveness: confidence,
          message: `${emotionRecord.studentName || 'Student'} has low attentiveness`,
          severity: 'low',
          timestamp: new Date()
        });
      }
      
      // Log alerts
      if (alerts.length > 0) {
        console.log('🚨 ALERTS:');
        alerts.forEach(alert => console.log(`   ${alert}`));
        console.log('-'.repeat(80));
      }
      
      // Send real-time update to lecturer
      io.to(`meeting-${meetingId}`).emit('student-emotion-live', {
        studentId,
        studentName: emotionRecord.studentName || 'Student',
        emotions,
        dominantEmotion,
        faceDetected,
        attentiveness: emotionRecord.attentiveness,
        timestamp: new Date()
      });
      
      console.log('📡 BROADCAST:');
      console.log(`   ✅ Real-time update sent to meeting room`);
      console.log(`   📢 Emitted to: meeting-${meetingId}`);
      console.log('='.repeat(80));
      console.log('🎭 EMOTION TRACKING DEBUG - END\n');
      // ============================================

    } catch (error) {
      console.error('\n' + '❌'.repeat(40));
      console.error('❌ ERROR IN EMOTION TRACKING:');
      console.error('❌'.repeat(40));
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      console.error('❌'.repeat(40) + '\n');
      socket.emit('error', { message: 'Failed to save emotion data' });
    }
  });

  // Student leaves meeting
  socket.on('leave-meeting', async (data) => {
    const { meetingId, studentId, studentName } = data;
    socket.leave(`meeting-${meetingId}`);
    
    console.log(`👋 Student ${studentName} left meeting ${meetingId}`);
    
    try {
      // Record attendance - student left
      const attendance = await Attendance.findOne({ meetingId, studentId });
      
      if (attendance) {
        const leaveTime = new Date();
        attendance.recordLeave(leaveTime);
        
        // Calculate attendance percentage if meeting has started
        const meeting = await Meeting.findById(meetingId);
        if (meeting && meeting.startedAt) {
          const meetingDuration = meeting.endedAt 
            ? Math.floor((meeting.endedAt - meeting.startedAt) / 1000)
            : Math.floor((new Date() - meeting.startedAt) / 1000);
          
          attendance.calculateAttendancePercentage(meetingDuration);
          
          // Update status based on percentage
          if (attendance.attendancePercentage < 50) {
            attendance.status = 'partial';
          }
        }
        
        await attendance.save();
        
        console.log(`✅ Attendance recorded: ${studentName} left at ${leaveTime}, duration: ${attendance.totalDuration}s`);
        
        // Notify lecturer with attendance details
        io.to(`meeting-${meetingId}`).emit('student-left', {
          studentId,
          studentName,
          leaveTime,
          totalDuration: attendance.totalDuration,
          attendancePercentage: attendance.attendancePercentage,
          status: attendance.status,
          timestamp: new Date()
        });
        
        // Send attendance summary to student
        socket.emit('attendance-recorded', {
          type: 'leave',
          meetingId,
          leaveTime,
          totalDuration: attendance.totalDuration,
          attendancePercentage: attendance.attendancePercentage,
          sessionCount: attendance.sessions.length
        });
      }
    } catch (error) {
      console.error('Error recording attendance on leave:', error);
      socket.emit('attendance-error', {
        message: 'Failed to record leave time'
      });
    }
  });

  // Lecturer requests current engagement
  socket.on('request-engagement', async (data) => {
    try {
      const { meetingId } = data;
      const engagement = await StudentEmotion.getCurrentEngagement(meetingId);
      
      socket.emit('engagement-data', {
        meetingId,
        ...engagement,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error fetching engagement:', error);
      socket.emit('error', { message: 'Failed to fetch engagement data' });
    }
  });

  // Lecturer requests alerts
  socket.on('request-alerts', async (data) => {
    try {
      const { meetingId } = data;
      const alerts = await StudentEmotion.getAlerts(meetingId);
      
      socket.emit('alerts-data', {
        meetingId,
        ...alerts,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      socket.emit('error', { message: 'Failed to fetch alerts' });
    }
  });

  // Lecturer requests real-time attendance
  socket.on('request-attendance', async (data) => {
    try {
      const { meetingId } = data;
      const attendances = await Attendance.find({ meetingId })
        .populate('studentId', 'firstName lastName email rollNumber')
        .sort({ firstJoinTime: 1 });
      
      const totalStudents = attendances.length;
      const presentCount = attendances.filter(a => a.isCurrentlyPresent).length;
      const lateCount = attendances.filter(a => a.isLate).length;
      
      socket.emit('attendance-data', {
        meetingId,
        statistics: {
          totalStudents,
          currentlyPresent: presentCount,
          lateCount,
          attendanceRate: totalStudents > 0 
            ? Math.round((presentCount / totalStudents) * 100 * 100) / 100
            : 0
        },
        attendances: attendances.map(a => ({
          studentId: a.studentId._id,
          studentName: `${a.studentId.firstName} ${a.studentId.lastName}`,
          rollNumber: a.studentId.rollNumber,
          status: a.status,
          firstJoinTime: a.firstJoinTime,
          lastLeaveTime: a.lastLeaveTime,
          totalDuration: a.totalDuration,
          sessionCount: a.sessions.length,
          isCurrentlyPresent: a.isCurrentlyPresent,
          isLate: a.isLate,
          attendancePercentage: a.attendancePercentage
        })),
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error fetching attendance:', error);
      socket.emit('error', { message: 'Failed to fetch attendance data' });
    }
  });

  // ============================================
  // 🔔 NOTIFICATION SYSTEM HANDLERS
  // ============================================
  
  // User authentication and joining their notification room
  socket.on('authenticate', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`🔔 User ${userId} joined notification room`);
      
      // Send confirmation
      socket.emit('authenticated', {
        userId,
        message: 'Connected to notification system',
        timestamp: new Date()
      });
    }
  });

  // Request unread notification count
  socket.on('get-unread-count', async (userId) => {
    try {
      const Notification = require('./models/Notification');
      const count = await Notification.getUnreadCount(userId);
      socket.emit('unread-count', { count });
    } catch (error) {
      console.error('Error getting unread count:', error);
      socket.emit('notification-error', { message: 'Failed to get unread count' });
    }
  });

  // Mark notification as read
  socket.on('mark-read', async ({ notificationId, userId }) => {
    try {
      const Notification = require('./models/Notification');
      await Notification.markAsRead(notificationId, userId);
      socket.emit('notification-read', { notificationId });
      
      // Send updated unread count
      const count = await Notification.getUnreadCount(userId);
      socket.emit('unread-count', { count });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      socket.emit('notification-error', { message: 'Failed to mark as read' });
    }
  });

  // Mark all notifications as read
  socket.on('mark-all-read', async (userId) => {
    try {
      const Notification = require('./models/Notification');
      await Notification.markAllAsRead(userId);
      socket.emit('all-notifications-read');
      socket.emit('unread-count', { count: 0 });
    } catch (error) {
      console.error('Error marking all as read:', error);
      socket.emit('notification-error', { message: 'Failed to mark all as read' });
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '🚀'.repeat(40));
  console.log('🚀 SMART LMS BACKEND SERVER STARTED');
  console.log('🚀'.repeat(40));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Local API URL: http://localhost:${PORT}`);
  console.log(`🌐 Network API URL: http://192.168.8.168:${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('-'.repeat(80));
  console.log('✅ ENABLED FEATURES:');
  console.log('   🔌 Socket.IO - Real-time communication');
  console.log('   🎭 Emotion Tracking - Face detection & analysis');
  console.log('   📊 Per-minute statistics - Debug monitoring');
  console.log('   📝 Attendance Tracking - Join/leave monitoring');
  console.log('-'.repeat(80));
  console.log('🎭 EMOTION TRACKING DEBUG MODE:');
  console.log('   📈 Console logging: ENABLED');
  console.log('   ⏱️  Per-minute summaries: ENABLED');
  console.log('   🔍 Detailed emotion data: ENABLED');
  console.log('   ⚠️  Alert detection: ENABLED');
  console.log('-'.repeat(80));
  console.log('📡 Socket.IO Events Available:');
  console.log('   • emotion-update - Receive emotion data');
  console.log('   • student-emotion-live - Broadcast to lecturer');
  console.log('   • emotion-alert - Alert notifications');
  console.log('   • join-meeting - Attendance tracking');
  console.log('   • leave-meeting - Session close');
  console.log('🚀'.repeat(40));
  console.log('✅ Server ready to track emotions! Start your 5-minute video test.\n');
});

module.exports = { app, server, io };
