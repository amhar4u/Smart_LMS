const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');

// Load environment variables
dotenv.config();

const app = express();

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

// Middleware
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:4201', 'http://localhost:4202'],
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
