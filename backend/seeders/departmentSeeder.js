const Department = require('../models/Department');

const departments = [
  {
    name: "IT Department",
    code: "IT",
    description: "Department of Information Technology",
    establishedYear: 2010,
    faculty: 'Faculty of Engineering and Technology',
    contactInfo: {
      email: 'it@smartlms.edu',
      phone: '+1-555-0101',
      office: 'IT Building, Floor 2'
    },
    isActive: true
  },
  {
    name: "Engineering Department",
    code: "ENG",
    description: "Department of Engineering",
    establishedYear: 2008,
    faculty: 'Faculty of Engineering and Technology',
    contactInfo: {
      email: 'eng@smartlms.edu',
      phone: '+1-555-0102',
      office: 'Engineering Building, Floor 1'
    },
    isActive: true
  },
  {
    name: "Medical Department",
    code: "MED",
    description: "Department of Medical Sciences",
    establishedYear: 2012,
    faculty: 'Faculty of Medical Sciences',
    contactInfo: {
      email: 'med@smartlms.edu',
      phone: '+1-555-0103',
      office: 'Medical Building, Floor 1'
    },
    isActive: true
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
