const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const Semester = require('../models/Semester');

const cleanData = async () => {
  try {
    console.log('🧹 Cleaning database...');
    
    // Remove all data except admin users
    await Department.deleteMany({});
    console.log('✅ Departments cleared');
    
    await Course.deleteMany({});
    console.log('✅ Courses cleared');
    
    await Batch.deleteMany({});
    console.log('✅ Batches cleared');
    
    await Semester.deleteMany({});
    console.log('✅ Semesters cleared');
    
    // Remove non-admin users
    await User.deleteMany({ role: { $ne: 'admin' } });
    console.log('✅ Non-admin users cleared');
    
    console.log('🎉 Database cleaned successfully! Admin users preserved.');
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  }
};

module.exports = cleanData;
