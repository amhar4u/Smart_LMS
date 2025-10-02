const mongoose = require('mongoose');
const Course = require('./models/Course');
const Department = require('./models/Department');
const Batch = require('./models/Batch');
const User = require('./models/User');
require('dotenv').config();

async function seedCourses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get departments
    const departments = await Department.find();
    console.log('Found departments:', departments.map(d => d.name));

    if (departments.length === 0) {
      console.log('No departments found!');
      return;
    }

    const itDept = departments.find(d => d.code === 'IT');
    const engDept = departments.find(d => d.code === 'ENG');

    if (!itDept || !engDept) {
      console.log('Required departments not found');
      return;
    }

    // Create courses
    const courses = [
      {
        name: 'BSc Information Technology',
        code: 'BSC-IT',
        description: 'Bachelor of Science in Information Technology',
        department: itDept._id,
        duration: 'semester',
        isActive: true
      },
      {
        name: 'BSc Software Engineering',
        code: 'BSC-SE',
        description: 'Bachelor of Science in Software Engineering',
        department: itDept._id,
        duration: 'semester',
        isActive: true
      },
      {
        name: 'BE Mechanical Engineering',
        code: 'BE-ME',
        description: 'Bachelor of Engineering in Mechanical Engineering',
        department: engDept._id,
        duration: 'semester',
        isActive: true
      },
      {
        name: 'BE Civil Engineering',
        code: 'BE-CE',
        description: 'Bachelor of Engineering in Civil Engineering',
        department: engDept._id,
        duration: 'semester',
        isActive: true
      }
    ];

    await Course.deleteMany({});
    const createdCourses = await Course.insertMany(courses);
    console.log('✅ Created courses:', createdCourses.length);

    // Get admin user for createdBy field
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin user found for createdBy field');
      return;
    }

    // Now create some batches
    const batches = [
      {
        name: 'IT Batch 2025',
        code: 'IT-2025-A',
        course: createdCourses[0]._id,
        department: itDept._id,
        startYear: 2025,
        endYear: 2029,
        maxStudents: 50,
        status: 'active',
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'SE Batch 2025',
        code: 'SE-2025-A',
        course: createdCourses[1]._id,
        department: itDept._id,
        startYear: 2025,
        endYear: 2029,
        maxStudents: 40,
        status: 'active',
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'ME Batch 2025',
        code: 'ME-2025-A',
        course: createdCourses[2]._id,
        department: engDept._id,
        startYear: 2025,
        endYear: 2029,
        maxStudents: 35,
        status: 'active',
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'CE Batch 2025',
        code: 'CE-2025-A',
        course: createdCourses[3]._id,
        department: engDept._id,
        startYear: 2025,
        endYear: 2029,
        maxStudents: 30,
        status: 'active',
        isActive: true,
        createdBy: admin._id
      }
    ];

    await Batch.deleteMany({});
    const createdBatches = await Batch.insertMany(batches);
    console.log('✅ Created batches:', createdBatches.length);

    await mongoose.disconnect();
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedCourses();
