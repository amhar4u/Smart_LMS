require('dotenv').config();
const mongoose = require('mongoose');
const Batch = require('./models/Batch');
const Semester = require('./models/Semester');
const Course = require('./models/Course');
const Department = require('./models/Department');

async function checkBatchSemesters() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const batches = await Batch.find()
      .populate('currentSemester')
      .populate('semesters')
      .populate('course', 'name code')
      .populate('department', 'name code');

    console.log(`Found ${batches.length} batches:\n`);

    batches.forEach(batch => {
      console.log(`📚 Batch: ${batch.name} (${batch.code})`);
      console.log(`   Course: ${batch.course?.name} (${batch.course?.code})`);
      console.log(`   Department: ${batch.department?.name} (${batch.department?.code})`);
      console.log(`   Status: ${batch.status}, Active: ${batch.isActive}`);
      console.log(`   Enrollment: ${batch.currentEnrollment}/${batch.maxStudents}`);
      console.log(`   Current Semester: ${batch.currentSemester ? batch.currentSemester.name : '❌ NOT SET'}`);
      console.log(`   All Semesters: [${batch.semesters.map(s => s.name).join(', ')}]`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBatchSemesters();
