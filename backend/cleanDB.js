require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Department = require('./models/Department');
const Course = require('./models/Course');
const Batch = require('./models/Batch');
const Semester = require('./models/Semester');

const cleanDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_lms');
    console.log('✅ Connected to MongoDB');
    
    // Clear all collections except preserve admin users
    await Department.deleteMany({});
    console.log('✅ Departments cleared');
    
    await Course.deleteMany({});
    console.log('✅ Courses cleared');
    
    await Batch.deleteMany({});
    console.log('✅ Batches cleared');
    
    await Semester.deleteMany({});
    console.log('✅ Semesters cleared');
    
    // Remove non-admin users
    const deletedUsers = await User.deleteMany({ role: { $ne: 'admin' } });
    console.log(`✅ Removed ${deletedUsers.deletedCount} non-admin users`);
    
    console.log('🎉 Database cleaned successfully! Admin users preserved.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

cleanDatabase();
