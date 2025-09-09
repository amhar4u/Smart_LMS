const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const User = require('../models/User');
const Department = require('../models/Department');
const Course = require('../models/Course');

const seedComprehensiveData = async () => {
  try {
    console.log('🌱 Starting comprehensive Smart LMS seeding...');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      User.deleteMany({ role: 'admin' }),
      Department.deleteMany({}),
      Course.deleteMany({})
    ]);

    // 0. Create Admin User first
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@smartlms.com',
      password: hashedPassword,
      phone: '+1234567890',
      role: 'admin',
      status: 'approved',
      isActive: true,
      employeeId: 'EMP-ADMIN-001',
      qualification: 'Masters in Computer Science',
      joinDate: new Date('2025-01-01'),
      address: {
        street: '123 Admin Street',
        city: 'Tech City',
        state: 'Tech State',
        zipCode: '12345',
        country: 'Tech Country'
      }
    });
    console.log(`✅ Created admin user: ${admin.email}`);

    // 1. Create Departments
    console.log('📋 Creating departments...');
    const departments = await Department.insertMany([
      {
        name: "IT Department",
        code: "IT",
        description: "Department of Information Technology",
        isActive: true
      },
      {
        name: "Engineering Department", 
        code: "ENG",
        description: "Department of Engineering",
        isActive: true
      },
      {
        name: "Medical Department",
        code: "MED", 
        description: "Department of Medical Sciences",
        isActive: true
      }
    ]);
    
    const [itDept, engDept, medDept] = departments;
    console.log(`✅ Created ${departments.length} departments`);

    // 2. Create Courses (4 per department)
    console.log('📚 Creating courses...');
    const courses = await Course.insertMany([
      // IT Department Courses
      { department: itDept._id, createdBy: admin._id, name: "BSc Information Technology", code: "BSC-IT", description: "Bachelor of Science in Information Technology", credits: 4, isActive: true },
      { department: itDept._id, createdBy: admin._id, name: "BSc Software Engineering", code: "BSC-SE", description: "Bachelor of Science in Software Engineering", credits: 4, isActive: true },
      { department: itDept._id, createdBy: admin._id, name: "BSc Data Science", code: "BSC-DS", description: "Bachelor of Science in Data Science", credits: 4, isActive: true },
      { department: itDept._id, createdBy: admin._id, name: "BSc Cybersecurity", code: "BSC-CS", description: "Bachelor of Science in Cybersecurity", credits: 4, isActive: true },
      
      // Engineering Department Courses  
      { department: engDept._id, createdBy: admin._id, name: "BE Mechanical Engineering", code: "BE-ME", description: "Bachelor of Engineering in Mechanical Engineering", credits: 4, isActive: true },
      { department: engDept._id, createdBy: admin._id, name: "BE Civil Engineering", code: "BE-CE", description: "Bachelor of Engineering in Civil Engineering", credits: 4, isActive: true },
      { department: engDept._id, createdBy: admin._id, name: "BE Electrical Engineering", code: "BE-EE", description: "Bachelor of Engineering in Electrical Engineering", credits: 4, isActive: true },
      { department: engDept._id, createdBy: admin._id, name: "BE Chemical Engineering", code: "BE-CHE", description: "Bachelor of Engineering in Chemical Engineering", credits: 4, isActive: true },
      
      // Medical Department Courses
      { department: medDept._id, createdBy: admin._id, name: "MBBS", code: "MBBS", description: "Bachelor of Medicine, Bachelor of Surgery", credits: 6, isActive: true },
      { department: medDept._id, createdBy: admin._id, name: "BSc Nursing", code: "BSC-N", description: "Bachelor of Science in Nursing", credits: 4, isActive: true },
      { department: medDept._id, createdBy: admin._id, name: "BSc Pharmacy", code: "BSC-P", description: "Bachelor of Science in Pharmacy", credits: 4, isActive: true },
      { department: medDept._id, createdBy: admin._id, name: "BSc Medical Laboratory Technology", code: "BSC-MLT", description: "Bachelor of Science in Medical Laboratory Technology", credits: 4, isActive: true }
    ]);
    console.log(`✅ Created ${courses.length} courses`);

    console.log('\n🎉 Comprehensive seeding completed successfully!');
    console.log('\n📊 Final Summary:');
    console.log(`   • ${departments.length} Departments`);
    console.log(`   • ${courses.length} Courses (4 per department)`);
    
    return {
      departments,
      courses
    };

  } catch (error) {
    console.error('❌ Error during comprehensive seeding:', error);
    throw error;
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-lms';
  console.log('🔗 Connecting to MongoDB...');
  
  mongoose.connect(mongoUri)
  .then(() => {
    console.log('📊 Connected to MongoDB successfully');
    return seedComprehensiveData();
  })
  .then(() => {
    console.log('✅ Comprehensive seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Comprehensive seeding failed:', error);
    process.exit(1);
  });
}

module.exports = { seedComprehensiveData };
