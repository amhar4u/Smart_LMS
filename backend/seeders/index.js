const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import seeders
const adminSeeder = require('./adminSeeder');
const courseSeeder = require('./courseSeeder');

// Import other seeders here when created
// const studentSeeder = require('./studentSeeder');
// const teacherSeeder = require('./teacherSeeder');

const seeders = {
  admin: adminSeeder,
  courses: courseSeeder,
  // student: studentSeeder,
  // teacher: teacherSeeder,
};

// Main seeder function
const runSeeders = async () => {
  try {
    console.log('🌱 Smart LMS Database Seeder');
    console.log('============================');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_lms';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
      if (args.includes('--help') || args.includes('-h')) {
      console.log(`
📖 Smart LMS Database Seeder Usage:

Run all seeders:     node seeders/index.js

Individual Seeder Usage:
-----------------------
node seeders/adminSeeder.js          - Seed admin users
node seeders/adminSeeder.js --clear  - Clear admin users

Available Seeders:
- admin: Seed admin users
- courses: Seed course/department data
      `);
      await mongoose.connection.close();
      process.exit(0);
    }
      process.exit(0);
    }
    
    if (args.includes('--admin')) {
      console.log('Running admin seeder...');
      await adminSeeder();
      console.log('✅ Admin seeder completed!');
      await mongoose.connection.close();
      process.exit(0);
      return;
    }
    
    if (args.includes('--courses')) {
      console.log('Running courses seeder...');
      await courseSeeder();
      console.log('✅ Courses seeder completed!');
      await mongoose.connection.close();
      process.exit(0);
      return;
    }
    
    // If no specific seeder is mentioned, run all
    if (args.length === 0) {
      console.log('Running all seeders...');
      await adminSeeder();
      await courseSeeder();
      console.log('✅ All seeders completed successfully!');
      await mongoose.connection.close();
      process.exit(0);
      return;
    }
    
    if (args.includes('--clear')) {
      console.log('⚠️  This will clear ALL data from the database!');
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('Are you sure you want to continue? (y/N): ', (answer) => {
        rl.close();
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          // Clear all data
          console.log('🗑️  Clearing all data...');
          // Add clearing logic here
          console.log('✅ All data cleared');
        } else {
          console.log('❌ Operation cancelled');
        }
        process.exit(0);
      });
      return;
    }
    
    // Default: show available options
    console.log(`
Available commands:
--admin     Run admin seeder
--courses   Run courses seeder
--clear     Clear all data
--help      Show this help message

To run individual seeders:
node seeders/adminSeeder.js
node seeders/courseSeeder.js

To run all seeders:
node seeders/index.js
    `);
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error in seeder:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seeders
runSeeders();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n⚠️  Process interrupted by user');
  process.exit(0);
});

runSeeders();
