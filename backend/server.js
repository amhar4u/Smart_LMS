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
      'http://192.168.8.168:4202'
    ],
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
    'http://192.168.8.168:4202'
  ],
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
app.use('/api/lecturer', require('./routes/lecturer'));
app.use('/api/students', require('./routes/students'));
app.use('/api/student-subject-levels', require('./routes/studentSubjectLevels'));
app.use('/api/emotions', require('./routes/emotions'));

// Emotion tracking configuration endpoint
app.get('/api/config/emotion-tracking', (req, res) => {
  res.json({
    interval: parseInt(process.env.EMOTION_TRACKING_INTERVAL) || 300000, // Default 5 minutes
    enabled: true
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

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Student joins a meeting room
  socket.on('join-meeting', async (data) => {
    const { meetingId, studentId, studentName } = data;
    socket.join(`meeting-${meetingId}`);
    socket.join(`student-${studentId}`);
    
    console.log(`👤 Student ${studentName} (${studentId}) joined meeting ${meetingId}`);
    
    // Notify lecturer
    io.to(`meeting-${meetingId}`).emit('student-joined', {
      studentId,
      studentName,
      timestamp: new Date()
    });
  });

  // Receive emotion data from student
  socket.on('emotion-update', async (data) => {
    try {
      const { meetingId, studentId, emotions, dominantEmotion, faceDetected, confidence, sessionId } = data;
      
      // Save emotion data to database
      const emotionRecord = new StudentEmotion({
        meetingId,
        studentId,
        emotions,
        dominantEmotion,
        faceDetected,
        detectionConfidence: confidence || 0,
        attentiveness: faceDetected ? confidence : 0,
        isPresent: true,
        sessionId
      });

      await emotionRecord.save();
      
      // Send real-time update to lecturer
      io.to(`meeting-${meetingId}`).emit('student-emotion-live', {
        studentId,
        emotions,
        dominantEmotion,
        faceDetected,
        attentiveness: emotionRecord.attentiveness,
        timestamp: new Date()
      });

      // Check for alerts (negative emotions)
      if (emotions.sad > 0.6 || emotions.angry > 0.6 || emotions.fearful > 0.5) {
        io.to(`meeting-${meetingId}`).emit('emotion-alert', {
          type: 'negative-emotion',
          studentId,
          emotion: dominantEmotion,
          value: emotions[dominantEmotion],
          severity: emotions.sad > 0.7 || emotions.angry > 0.7 ? 'high' : 'medium',
          timestamp: new Date()
        });
      }

      // Check for low attentiveness
      if (!faceDetected || confidence < 0.5) {
        io.to(`meeting-${meetingId}`).emit('emotion-alert', {
          type: 'low-attentiveness',
          studentId,
          attentiveness: confidence,
          severity: 'low',
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('Error saving emotion data:', error);
      socket.emit('error', { message: 'Failed to save emotion data' });
    }
  });

  // Student leaves meeting
  socket.on('leave-meeting', async (data) => {
    const { meetingId, studentId, studentName } = data;
    socket.leave(`meeting-${meetingId}`);
    
    console.log(`👋 Student ${studentName} left meeting ${meetingId}`);
    
    io.to(`meeting-${meetingId}`).emit('student-left', {
      studentId,
      studentName,
      timestamp: new Date()
    });
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

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Local API URL: http://localhost:${PORT}`);
  console.log(`🌐 Network API URL: http://192.168.8.168:${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔌 Socket.IO enabled for emotion tracking`);
});

module.exports = { app, server, io };
