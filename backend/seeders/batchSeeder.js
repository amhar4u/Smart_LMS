const Batch = require('../models/Batch');
const Course = require('../models/Course');
const Department = require('../models/Department');
const Semester = require('../models/Semester');
const User = require('../models/User');

const batchSeeder = async () => {
  try {
    console.log('Starting batch seeding...');

    // Clear existing batches
    await Batch.deleteMany({});
    console.log('Cleared existing batches');

    // Get sample data for relationships
    const departments = await Department.find().limit(3);
    const courses = await Course.find().limit(5);
    const semesters = await Semester.find().limit(4);
    const adminUser = await User.findOne({ role: 'admin' });

    if (!departments.length || !courses.length || !semesters.length || !adminUser) {
      console.log('Missing required data for batch seeding. Please run other seeders first.');
      return;
    }

    const currentYear = new Date().getFullYear();
    
    const batchData = [
      // Computer Science Batches
      {
        name: 'CS Batch Alpha',
        code: 'CS2025A',
        course: courses[0]._id, // Use first available course
        department: departments[0]._id, // Use first available department (CS)
        startYear: currentYear,
        endYear: currentYear + 4,
        maxStudents: 60,
        currentEnrollment: 25,
        description: 'Computer Science batch for academic year 2025-2029',
        semesters: [semesters[0]._id],
        currentSemester: semesters[0]._id,
        createdBy: adminUser._id
      },
      {
        name: 'IT Batch Beta',
        code: 'IT2025A',
        course: courses[1] ? courses[1]._id : courses[0]._id,
        department: departments[1] ? departments[1]._id : departments[0]._id, // IT department
        startYear: currentYear,
        endYear: currentYear + 4,
        maxStudents: 50,
        currentEnrollment: 30,
        description: 'Information Technology batch for academic year 2025-2029',
        semesters: [semesters[0]._id],
        currentSemester: semesters[0]._id,
        createdBy: adminUser._id
      },
      {
        name: 'Business Admin Batch',
        code: 'BA2025A',
        course: courses[2] ? courses[2]._id : courses[0]._id,
        department: departments[2] ? departments[2]._id : departments[0]._id, // BA department
        startYear: currentYear,
        endYear: currentYear + 3,
        maxStudents: 40,
        currentEnrollment: 20,
        description: 'Business Administration batch for academic year 2025-2028',
        semesters: [semesters[0]._id],
        currentSemester: semesters[0]._id,
        createdBy: adminUser._id
      },
      {
        name: 'General Batch 2025',
        code: 'GEN2025A',
        course: courses[0]._id,
        department: departments[0]._id,
        startYear: currentYear,
        endYear: currentYear + 4,
        maxStudents: 45,
        currentEnrollment: 15,
        description: 'General batch for academic year 2025-2029',
        semesters: [semesters[0]._id],
        currentSemester: semesters[0]._id,
        createdBy: adminUser._id
      }
    ];

    // Create batches
    const createdBatches = await Batch.insertMany(batchData);
    console.log(`✅ Created ${createdBatches.length} batches:`);
    
    createdBatches.forEach(batch => {
      console.log(`   - ${batch.name} (${batch.code}): ${batch.currentEnrollment}/${batch.maxStudents} students`);
    });

    // Update some batches with additional semesters
    console.log('\nUpdating batch relationships...');
    
    for (const batch of createdBatches) {
      if (batch.semesters && batch.semesters.length > 0) {
        await Batch.findByIdAndUpdate(batch._id, {
          $set: {
            semesters: batch.semesters,
            currentSemester: batch.currentSemester
          }
        });
      }
    }

    console.log('✅ Batch seeding completed successfully!');
    
    return {
      success: true,
      count: createdBatches.length,
      batches: createdBatches
    };
    
  } catch (error) {
    console.error('❌ Error seeding batches:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = batchSeeder;
