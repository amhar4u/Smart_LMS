const Course = require('../models/Course');
const User = require('../models/User');

const defaultCourses = [
  {
    name: 'Computer Science',
    code: 'CS',
    description: 'Comprehensive program covering programming, algorithms, data structures, and software engineering.',
    category: 'Technology'
  },
  {
    name: 'Information Technology',
    code: 'IT',
    description: 'Focus on information systems, networking, and technology management.',
    category: 'Technology'
  },
  {
    name: 'Software Engineering',
    code: 'SE',
    description: 'Advanced software development methodologies, project management, and system design.',
    category: 'Technology'
  },
  {
    name: 'Data Science',
    code: 'DS',
    description: 'Statistical analysis, machine learning, and big data analytics.',
    category: 'Technology'
  },
  {
    name: 'Cybersecurity',
    code: 'CYB',
    description: 'Information security, ethical hacking, and digital forensics.',
    category: 'Technology'
  },
  {
    name: 'Business Administration',
    code: 'BA',
    description: 'Management principles, business strategy, and organizational behavior.',
    category: 'Business'
  },
  {
    name: 'Marketing',
    code: 'MKT',
    description: 'Digital marketing, consumer behavior, and brand management.',
    category: 'Business'
  },
  {
    name: 'Finance',
    code: 'FIN',
    description: 'Financial analysis, investment strategies, and corporate finance.',
    category: 'Business'
  },
  {
    name: 'Mechanical Engineering',
    code: 'ME',
    description: 'Design, manufacturing, and maintenance of mechanical systems.',
    category: 'Engineering'
  },
  {
    name: 'Electrical Engineering',
    code: 'EE',
    description: 'Electrical systems, power generation, and electronics.',
    category: 'Engineering'
  },
  {
    name: 'Mathematics',
    code: 'MATH',
    description: 'Pure and applied mathematics, statistics, and mathematical modeling.',
    category: 'Science'
  },
  {
    name: 'Physics',
    code: 'PHYS',
    description: 'Theoretical and experimental physics, quantum mechanics, and astrophysics.',
    category: 'Science'
  },
  {
    name: 'Chemistry',
    code: 'CHEM',
    description: 'Organic, inorganic, and physical chemistry with laboratory work.',
    category: 'Science'
  },
  {
    name: 'Biology',
    code: 'BIO',
    description: 'Life sciences, genetics, ecology, and biotechnology.',
    category: 'Science'
  },
  {
    name: 'Medicine',
    code: 'MED',
    description: 'Medical sciences, clinical practice, and healthcare management.',
    category: 'Medicine'
  },
  {
    name: 'English Literature',
    code: 'ENG',
    description: 'Literary analysis, creative writing, and communication skills.',
    category: 'Arts'
  },
  {
    name: 'History',
    code: 'HIST',
    description: 'World history, historical research methods, and cultural studies.',
    category: 'Arts'
  },
  {
    name: 'Psychology',
    code: 'PSY',
    description: 'Human behavior, cognitive psychology, and research methods.',
    category: 'Science'
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

    // Create courses with admin as creator
    const coursesToCreate = defaultCourses.map(course => ({
      ...course,
      createdBy: adminUser._id,
      isActive: true
    }));

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
