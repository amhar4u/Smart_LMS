const Course = require('../models/Course');

const courses = [
  // IT Department Courses (4 courses)
  {
    _id: "CRS201",
    departmentId: "DPT101",
    name: "BSc Information Technology",
    code: "BSC-IT",
    durationYears: 4,
    description: "Bachelor of Science in Information Technology program covering software development, database management, and network administration.",
    isActive: true
  },
  {
    _id: "CRS202",
    departmentId: "DPT101",
    name: "BSc Software Engineering",
    code: "BSC-SE",
    durationYears: 4,
    description: "Bachelor of Science in Software Engineering focusing on software design, development methodologies, and project management.",
    isActive: true
  },
  {
    _id: "CRS203",
    departmentId: "DPT101",
    name: "BSc Data Science",
    code: "BSC-DS",
    durationYears: 4,
    description: "Bachelor of Science in Data Science covering machine learning, statistics, and big data analytics.",
    isActive: true
  },
  {
    _id: "CRS204",
    departmentId: "DPT101",
    name: "BSc Cybersecurity",
    code: "BSC-CS",
    durationYears: 4,
    description: "Bachelor of Science in Cybersecurity focusing on information security, ethical hacking, and digital forensics.",
    isActive: true
  },

  // Engineering Department Courses (4 courses)
  {
    _id: "CRS301",
    departmentId: "DPT102",
    name: "BE Mechanical Engineering",
    code: "BE-ME",
    durationYears: 4,
    description: "Bachelor of Engineering in Mechanical Engineering covering thermodynamics, fluid mechanics, and manufacturing.",
    isActive: true
  },
  {
    _id: "CRS302",
    departmentId: "DPT102",
    name: "BE Civil Engineering",
    code: "BE-CE",
    durationYears: 4,
    description: "Bachelor of Engineering in Civil Engineering focusing on structural design, construction, and infrastructure.",
    isActive: true
  },
  {
    _id: "CRS303",
    departmentId: "DPT102",
    name: "BE Electrical Engineering",
    code: "BE-EE",
    durationYears: 4,
    description: "Bachelor of Engineering in Electrical Engineering covering power systems, electronics, and control systems.",
    isActive: true
  },
  {
    _id: "CRS304",
    departmentId: "DPT102",
    name: "BE Chemical Engineering",
    code: "BE-ChE",
    durationYears: 4,
    description: "Bachelor of Engineering in Chemical Engineering focusing on process design, chemical reactions, and plant operations.",
    isActive: true
  },

  // Medical Department Courses (4 courses)
  {
    _id: "CRS401",
    departmentId: "DPT103",
    name: "MBBS",
    code: "MBBS",
    durationYears: 6,
    description: "Bachelor of Medicine and Bachelor of Surgery - comprehensive medical degree program.",
    isActive: true
  },
  {
    _id: "CRS402",
    departmentId: "DPT103",
    name: "BSc Nursing",
    code: "BSC-N",
    durationYears: 4,
    description: "Bachelor of Science in Nursing focusing on patient care, medical procedures, and healthcare management.",
    isActive: true
  },
  {
    _id: "CRS403",
    departmentId: "DPT103",
    name: "BSc Pharmacy",
    code: "BSC-P",
    durationYears: 4,
    description: "Bachelor of Science in Pharmacy covering pharmaceutical sciences, drug development, and clinical pharmacy.",
    isActive: true
  },
  {
    _id: "CRS404",
    departmentId: "DPT103",
    name: "BSc Medical Laboratory Technology",
    code: "BSC-MLT",
    durationYears: 4,
    description: "Bachelor of Science in Medical Laboratory Technology focusing on diagnostic testing and laboratory management.",
    isActive: true
  }
];

const seedCourses = async () => {
  try {
    await Course.deleteMany({});
    const createdCourses = await Course.insertMany(courses);
    console.log(`✅ ${createdCourses.length} courses seeded successfully`);
    return createdCourses;
  } catch (error) {
    console.error('❌ Error seeding courses:', error);
    throw error;
  }
};

module.exports = { seedCourses, courses };
