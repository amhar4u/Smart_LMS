const Course = require('../models/Course');
const User = require('../models/User');
const Department = require('../models/Department');

const defaultCourses = [
  {
    name: 'Computer Science',
    code: 'CS101',
    description: 'Comprehensive program covering programming, algorithms, data structures, and software engineering.',
    category: 'Technology',
    departmentCode: 'CS',
    credits: 4,
    duration: 'semester'
  },
  {
    name: 'Information Technology',
    code: 'IT101',
    description: 'Focus on information systems, networking, and technology management.',
    category: 'Technology',
    departmentCode: 'IT',
    credits: 3,
    duration: 'semester'
  },
  {
    name: 'Software Engineering',
    code: 'CS201',
    description: 'Advanced software development methodologies, project management, and system design.',
    category: 'Technology',
    departmentCode: 'CS',
    credits: 4,
    duration: 'semester'
  },
  {
    name: 'Data Science',
    code: 'CS301',
    description: 'Statistical analysis, machine learning, and big data analytics.',
    category: 'Technology',
    departmentCode: 'CS',
    credits: 4,
    duration: 'semester'
  },
  {
    name: 'Cybersecurity',
    code: 'IT201',
    description: 'Information security, ethical hacking, and digital forensics.',
    category: 'Technology',
    departmentCode: 'IT',
    credits: 3,
    duration: 'semester'
  },
  {
    name: 'Business Administration',
    code: 'BA101',
    description: 'Management principles, business strategy, and organizational behavior.',
    category: 'Business',
    departmentCode: 'BA',
    credits: 3,
    duration: 'semester'
  },
  {
    name: 'Marketing',
    code: 'BA201',
    description: 'Digital marketing, consumer behavior, and brand management.',
    category: 'Business',
    departmentCode: 'BA',
    credits: 3,
    duration: 'semester'
  },
  {
    name: 'Finance',
    code: 'BA301',
    description: 'Financial analysis, investment strategies, and corporate finance.',
    category: 'Business',
    departmentCode: 'BA',
    credits: 3,
    duration: 'semester'
  },
  {
    name: 'Mechanical Engineering',
    code: 'ME101',
    description: 'Design, manufacturing, and maintenance of mechanical systems.',
    category: 'Engineering',
    departmentCode: 'ME',
    credits: 4,
    duration: 'semester'
  },
  {
    name: 'Electrical Engineering',
    code: 'EE101',
    description: 'Electrical systems, power generation, and electronics.',
    category: 'Engineering',
    departmentCode: 'EE',
    credits: 4,
    duration: 'semester'
  },
  {
    name: 'Mathematics',
    code: 'MATH101',
    description: 'Pure and applied mathematics, statistics, and mathematical modeling.',
    category: 'Science',
    departmentCode: 'MATH',
    credits: 3,
    duration: 'semester'
  },
  {
    name: 'Physics',
    code: 'PHYS101',
    description: 'Theoretical and experimental physics, quantum mechanics, and astrophysics.',
    category: 'Science',
    departmentCode: 'PHYS',
    credits: 4,
    duration: 'semester'
  },
  {
    name: 'Civil Engineering',
    code: 'CE101',
    description: 'Construction, infrastructure design, and project management.',
    category: 'Engineering',
    departmentCode: 'CE',
    credits: 4,
    duration: 'semester'
  },
  {
    name: 'English Literature',
    code: 'ENG101',
    description: 'Literary analysis, creative writing, and communication skills.',
    category: 'Arts',
    departmentCode: 'ENG',
    credits: 3,
    duration: 'semester'
  },
  {
    name: 'Psychology',
    code: 'PSY101',
    description: 'Human behavior, cognitive psychology, and research methods.',
    category: 'Science',
    departmentCode: 'PSY',
    credits: 3,
    duration: 'semester'
  }
];

async function seedCourses() {
  try {
    console.log('🌱 Starting courses seeding...');

    // Find an admin user to be the creator
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('❌ No admin user found. Please run the admin seeder first.');
      return;
    }

    console.log(`✅ Found admin user: ${adminUser.email}`);

    // Check if courses already exist
    const existingCoursesCount = await Course.countDocuments();
    
    if (existingCoursesCount > 0) {
      console.log(`ℹ️  Found ${existingCoursesCount} existing courses. Skipping course seeding.`);
      return;
    }

    // Get all departments to map courses to departments
    const departments = await Department.find({ isActive: true });
    console.log(`✅ Found ${departments.length} departments`);

    if (departments.length === 0) {
      console.log('❌ No departments found. Please run the department seeder first.');
      return;
    }

    // Create a map of department codes to department IDs
    const departmentMap = {};
    departments.forEach(dept => {
      departmentMap[dept.code] = dept._id;
    });

    // Create courses with admin as creator and proper department assignment
    const coursesToCreate = [];
    
    for (const course of defaultCourses) {
      const departmentId = departmentMap[course.departmentCode];
      
      if (departmentId) {
        coursesToCreate.push({
          name: course.name,
          code: course.code,
          description: course.description,
          department: departmentId,
          credits: course.credits,
          duration: course.duration,
          createdBy: adminUser._id,
          isActive: true
        });
      } else {
        console.log(`⚠️  Department ${course.departmentCode} not found for course ${course.name}`);
      }
    }

    if (coursesToCreate.length === 0) {
      console.log('❌ No courses could be created due to missing departments.');
      return;
    }

    const createdCourses = await Course.insertMany(coursesToCreate);

    console.log(`✅ Successfully created ${createdCourses.length} courses:`);
    createdCourses.forEach(course => {
      console.log(`   - ${course.name} (${course.code})`);
    });

    return createdCourses;

  } catch (error) {
    console.error('❌ Error seeding courses:', error);
    throw error;
  }
}

module.exports = seedCourses;
