const Semester = require('../models/Semester');

const semesters = [
  {
    name: 'First Semester',
    code: 'SEM1',
    order: 1,
    description: 'Foundation semester focusing on basic concepts and fundamental subjects.',
    duration: '6 months',
    creditRange: { min: 15, max: 20 }
  },
  {
    name: 'Second Semester',
    code: 'SEM2',
    order: 2,
    description: 'Second semester building upon foundation knowledge with intermediate subjects.',
    duration: '6 months',
    creditRange: { min: 15, max: 20 }
  },
  {
    name: 'Third Semester',
    code: 'SEM3',
    order: 3,
    description: 'Third semester introducing specialized subjects and core concepts.',
    duration: '6 months',
    creditRange: { min: 16, max: 22 }
  },
  {
    name: 'Fourth Semester',
    code: 'SEM4',
    order: 4,
    description: 'Fourth semester focusing on advanced concepts and practical applications.',
    duration: '6 months',
    creditRange: { min: 16, max: 22 }
  },
  {
    name: 'Fifth Semester',
    code: 'SEM5',
    order: 5,
    description: 'Fifth semester emphasizing specialized knowledge and industry exposure.',
    duration: '6 months',
    creditRange: { min: 18, max: 24 }
  },
  {
    name: 'Sixth Semester',
    code: 'SEM6',
    order: 6,
    description: 'Sixth semester with advanced specialized subjects and project work.',
    duration: '6 months',
    creditRange: { min: 18, max: 24 }
  },
  {
    name: 'Seventh Semester',
    code: 'SEM7',
    order: 7,
    description: 'Seventh semester focusing on specialization, research, and internship opportunities.',
    duration: '6 months',
    creditRange: { min: 16, max: 22 }
  },
  {
    name: 'Eighth Semester',
    code: 'SEM8',
    order: 8,
    description: 'Final semester with capstone projects, industry integration, and career preparation.',
    duration: '6 months',
    creditRange: { min: 16, max: 22 }
  },
  {
    name: 'Ninth Semester',
    code: 'SEM9',
    order: 9,
    description: 'Extended program ninth semester for specialized degrees and advanced studies.',
    duration: '6 months',
    creditRange: { min: 12, max: 18 }
  },
  {
    name: 'Tenth Semester',
    code: 'SEM10',
    order: 10,
    description: 'Extended program final semester for comprehensive project and thesis work.',
    duration: '6 months',
    creditRange: { min: 12, max: 18 }
  }
];

const seedSemesters = async () => {
  try {
    console.log('🌱 [SEEDER] Starting semester seeding...');

    // Clear existing semesters
    await Semester.deleteMany({});
    console.log('🧹 [SEEDER] Cleared existing semesters');

    // Insert new semesters
    const createdSemesters = await Semester.insertMany(semesters);
    console.log(`✅ [SEEDER] Successfully created ${createdSemesters.length} semesters`);

    // Display created semesters
    createdSemesters.forEach(sem => {
      console.log(`   📅 ${sem.name} (${sem.code}) - Order: ${sem.order}`);
    });

    return {
      success: true,
      count: createdSemesters.length,
      semesters: createdSemesters
    };
  } catch (error) {
    console.error('❌ [SEEDER] Error seeding semesters:', error);
    throw error;
  }
};

module.exports = {
  seedSemesters,
  semesters
};
