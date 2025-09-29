const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const Module = require('../models/Module');
const Subject = require('../models/Subject');
const User = require('../models/User');

const seedModules = async () => {
  try {
    console.log('🌱 Starting modules seeding...');
    
    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');
    }

    // Clear existing modules
    console.log('🧹 Clearing existing modules...');
    await Module.deleteMany({});
    
    // Get some subjects and admin user
    const subjects = await Subject.find().limit(3);
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (subjects.length === 0) {
      console.log('❌ No subjects found. Please run subject seeder first.');
      return;
    }
    
    if (!adminUser) {
      console.log('❌ No admin user found. Please run admin seeder first.');
      return;
    }

    // Sample modules data
    const modulesData = [
      {
        name: 'Introduction to Programming',
        code: 'MOD-CS-001',
        description: 'Basic concepts of programming including variables, data types, control structures, and functions. Students will learn fundamental programming principles using practical examples.',
        subject: subjects[0]._id,
        order: 1,
        isActive: true,
        documents: [
          {
            name: 'Programming Basics.pdf',
            driveFileId: 'sample_drive_id_1',
            driveLink: 'https://drive.google.com/file/d/sample_drive_id_1/view',
            fileType: 'pdf',
            size: 2048576
          },
          {
            name: 'Variables and Data Types.pdf',
            driveFileId: 'sample_drive_id_2',
            driveLink: 'https://drive.google.com/file/d/sample_drive_id_2/view',
            fileType: 'pdf',
            size: 1536000
          }
        ],
        video: {
          name: 'Intro to Programming Lecture.mp4',
          driveFileId: 'sample_video_id_1',
          driveLink: 'https://drive.google.com/file/d/sample_video_id_1/view',
          duration: '45:30'
        },
        createdBy: adminUser._id
      },
      {
        name: 'Object-Oriented Programming',
        code: 'MOD-CS-002',
        description: 'Advanced programming concepts including classes, objects, inheritance, polymorphism, and encapsulation. Students will design and implement object-oriented solutions.',
        subject: subjects[0]._id,
        order: 2,
        isActive: true,
        documents: [
          {
            name: 'OOP Principles.pdf',
            driveFileId: 'sample_drive_id_3',
            driveLink: 'https://drive.google.com/file/d/sample_drive_id_3/view',
            fileType: 'pdf',
            size: 3072000
          },
          {
            name: 'Class Design Patterns.pdf',
            driveFileId: 'sample_drive_id_4',
            driveLink: 'https://drive.google.com/file/d/sample_drive_id_4/view',
            fileType: 'pdf',
            size: 2560000
          },
          {
            name: 'Inheritance Examples.pdf',
            driveFileId: 'sample_drive_id_5',
            driveLink: 'https://drive.google.com/file/d/sample_drive_id_5/view',
            fileType: 'pdf',
            size: 1843200
          }
        ],
        video: {
          name: 'OOP Concepts Explained.mp4',
          driveFileId: 'sample_video_id_2',
          driveLink: 'https://drive.google.com/file/d/sample_video_id_2/view',
          duration: '52:15'
        },
        createdBy: adminUser._id
      },
      {
        name: 'Database Fundamentals',
        code: 'MOD-CS-003',
        description: 'Introduction to database systems, relational model, SQL basics, database design principles, and normalization. Students will learn to design and query databases.',
        subject: subjects[0]._id,
        order: 3,
        isActive: true,
        documents: [
          {
            name: 'Database Concepts.pdf',
            driveFileId: 'sample_drive_id_6',
            driveLink: 'https://drive.google.com/file/d/sample_drive_id_6/view',
            fileType: 'pdf',
            size: 4096000
          },
          {
            name: 'SQL Reference Guide.pdf',
            driveFileId: 'sample_drive_id_7',
            driveLink: 'https://drive.google.com/file/d/sample_drive_id_7/view',
            fileType: 'pdf',
            size: 2304000
          }
        ],
        video: {
          name: 'Database Design Tutorial.mp4',
          driveFileId: 'sample_video_id_3',
          driveLink: 'https://drive.google.com/file/d/sample_video_id_3/view',
          duration: '38:45'
        },
        createdBy: adminUser._id
      }
    ];

    // Add modules for second subject if available
    if (subjects.length > 1) {
      modulesData.push(
        {
          name: 'Linear Algebra Basics',
          code: 'MOD-MATH-001',
          description: 'Introduction to vectors, matrices, linear transformations, and systems of linear equations. Foundation for advanced mathematics and engineering applications.',
          subject: subjects[1]._id,
          order: 1,
          isActive: true,
          documents: [
            {
              name: 'Vector Operations.pdf',
              driveFileId: 'sample_drive_id_8',
              driveLink: 'https://drive.google.com/file/d/sample_drive_id_8/view',
              fileType: 'pdf',
              size: 2816000
            },
            {
              name: 'Matrix Theory.pdf',
              driveFileId: 'sample_drive_id_9',
              driveLink: 'https://drive.google.com/file/d/sample_drive_id_9/view',
              fileType: 'pdf',
              size: 3584000
            }
          ],
          video: {
            name: 'Linear Algebra Introduction.mp4',
            driveFileId: 'sample_video_id_4',
            driveLink: 'https://drive.google.com/file/d/sample_video_id_4/view',
            duration: '41:20'
          },
          createdBy: adminUser._id
        },
        {
          name: 'Calculus I',
          code: 'MOD-MATH-002',
          description: 'Differential calculus including limits, derivatives, and applications. Students will learn to solve optimization problems and analyze functions.',
          subject: subjects[1]._id,
          order: 2,
          isActive: true,
          documents: [
            {
              name: 'Limits and Continuity.pdf',
              driveFileId: 'sample_drive_id_10',
              driveLink: 'https://drive.google.com/file/d/sample_drive_id_10/view',
              fileType: 'pdf',
              size: 2240000
            }
          ],
          video: {
            name: 'Derivatives Explained.mp4',
            driveFileId: 'sample_video_id_5',
            driveLink: 'https://drive.google.com/file/d/sample_video_id_5/view',
            duration: '36:12'
          },
          createdBy: adminUser._id
        }
      );
    }

    // Add module for third subject if available
    if (subjects.length > 2) {
      modulesData.push({
        name: 'Research Methodology',
        code: 'MOD-RES-001',
        description: 'Principles of scientific research, research design, data collection methods, statistical analysis, and academic writing. Students will develop research skills.',
        subject: subjects[2]._id,
        order: 1,
        isActive: true,
        documents: [
          {
            name: 'Research Methods Overview.pdf',
            driveFileId: 'sample_drive_id_11',
            driveLink: 'https://drive.google.com/file/d/sample_drive_id_11/view',
            fileType: 'pdf',
            size: 3328000
          },
          {
            name: 'Statistical Analysis Guide.pdf',
            driveFileId: 'sample_drive_id_12',
            driveLink: 'https://drive.google.com/file/d/sample_drive_id_12/view',
            fileType: 'pdf',
            size: 2720000
          },
          {
            name: 'Academic Writing Standards.pdf',
            driveFileId: 'sample_drive_id_13',
            driveLink: 'https://drive.google.com/file/d/sample_drive_id_13/view',
            fileType: 'pdf',
            size: 1920000
          }
        ],
        video: {
          name: 'Research Design Workshop.mp4',
          driveFileId: 'sample_video_id_6',
          driveLink: 'https://drive.google.com/file/d/sample_video_id_6/view',
          duration: '48:33'
        },
        createdBy: adminUser._id
      });
    }

    // Create modules
    console.log('🎯 Creating modules...');
    const modules = await Module.insertMany(modulesData);
    
    console.log(`✅ Successfully created ${modules.length} modules`);
    
    // Display created modules
    modules.forEach(module => {
      console.log(`   📚 ${module.name} (${module.code}) - ${module.documents.length} documents, ${module.video ? '1 video' : 'no video'}`);
    });
    
    console.log('🎉 Module seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding modules:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedModules()
    .then(() => {
      console.log('✅ Module seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Module seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedModules };
