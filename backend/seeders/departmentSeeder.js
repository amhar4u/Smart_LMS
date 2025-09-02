const Department = require('../models/Department');

const departments = [
  {
    name: 'Computer Science',
    code: 'CS',
    description: 'Department of Computer Science and Engineering, focusing on software development, algorithms, data structures, and emerging technologies.',
    establishedYear: 2010,
    faculty: 'Faculty of Engineering and Technology',
    contactInfo: {
      email: 'cs@smartlms.edu',
      phone: '+1-555-0101',
      office: 'Engineering Building, Floor 3'
    }
  },
  {
    name: 'Information Technology',
    code: 'IT',
    description: 'Department of Information Technology, specializing in network administration, cybersecurity, database management, and system analysis.',
    establishedYear: 2012,
    faculty: 'Faculty of Engineering and Technology',
    contactInfo: {
      email: 'it@smartlms.edu',
      phone: '+1-555-0102',
      office: 'IT Building, Floor 2'
    }
  },
  {
    name: 'Business Administration',
    code: 'BA',
    description: 'Department of Business Administration, covering management, marketing, finance, human resources, and entrepreneurship.',
    establishedYear: 2008,
    faculty: 'Faculty of Business and Economics',
    contactInfo: {
      email: 'ba@smartlms.edu',
      phone: '+1-555-0103',
      office: 'Business Building, Floor 1'
    }
  },
  {
    name: 'Electrical Engineering',
    code: 'EE',
    description: 'Department of Electrical Engineering, focusing on power systems, electronics, control systems, and renewable energy.',
    establishedYear: 2009,
    faculty: 'Faculty of Engineering and Technology',
    contactInfo: {
      email: 'ee@smartlms.edu',
      phone: '+1-555-0104',
      office: 'Engineering Building, Floor 4'
    }
  },
  {
    name: 'Mechanical Engineering',
    code: 'ME',
    description: 'Department of Mechanical Engineering, specializing in design, manufacturing, thermodynamics, and mechanical systems.',
    establishedYear: 2011,
    faculty: 'Faculty of Engineering and Technology',
    contactInfo: {
      email: 'me@smartlms.edu',
      phone: '+1-555-0105',
      office: 'Engineering Building, Floor 5'
    }
  },
  {
    name: 'Civil Engineering',
    code: 'CE',
    description: 'Department of Civil Engineering, covering structural engineering, transportation, environmental engineering, and construction management.',
    establishedYear: 2013,
    faculty: 'Faculty of Engineering and Technology',
    contactInfo: {
      email: 'ce@smartlms.edu',
      phone: '+1-555-0106',
      office: 'Engineering Building, Floor 6'
    }
  },
  {
    name: 'Mathematics',
    code: 'MATH',
    description: 'Department of Mathematics, focusing on pure and applied mathematics, statistics, and mathematical modeling.',
    establishedYear: 2007,
    faculty: 'Faculty of Sciences',
    contactInfo: {
      email: 'math@smartlms.edu',
      phone: '+1-555-0107',
      office: 'Science Building, Floor 2'
    }
  },
  {
    name: 'Physics',
    code: 'PHYS',
    description: 'Department of Physics, covering theoretical and experimental physics, quantum mechanics, and materials science.',
    establishedYear: 2008,
    faculty: 'Faculty of Sciences',
    contactInfo: {
      email: 'physics@smartlms.edu',
      phone: '+1-555-0108',
      office: 'Science Building, Floor 3'
    }
  },
  {
    name: 'English Literature',
    code: 'ENG',
    description: 'Department of English Literature, specializing in literary analysis, creative writing, linguistics, and communication skills.',
    establishedYear: 2006,
    faculty: 'Faculty of Arts and Humanities',
    contactInfo: {
      email: 'english@smartlms.edu',
      phone: '+1-555-0109',
      office: 'Arts Building, Floor 1'
    }
  },
  {
    name: 'Psychology',
    code: 'PSY',
    description: 'Department of Psychology, focusing on cognitive psychology, behavioral studies, counseling, and research methods.',
    establishedYear: 2014,
    faculty: 'Faculty of Social Sciences',
    contactInfo: {
      email: 'psychology@smartlms.edu',
      phone: '+1-555-0110',
      office: 'Social Sciences Building, Floor 2'
    }
  }
];

const seedDepartments = async () => {
  try {
    console.log('🌱 [SEEDER] Starting department seeding...');

    // Clear existing departments
    await Department.deleteMany({});
    console.log('🧹 [SEEDER] Cleared existing departments');

    // Insert new departments
    const createdDepartments = await Department.insertMany(departments);
    console.log(`✅ [SEEDER] Successfully created ${createdDepartments.length} departments`);

    // Display created departments
    createdDepartments.forEach(dept => {
      console.log(`   📋 ${dept.name} (${dept.code})`);
    });

    return {
      success: true,
      count: createdDepartments.length,
      departments: createdDepartments
    };
  } catch (error) {
    console.error('❌ [SEEDER] Error seeding departments:', error);
    throw error;
  }
};

module.exports = {
  seedDepartments,
  departments
};
