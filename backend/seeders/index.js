const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import seeders
const adminSeeder = require('./adminSeeder');
const courseSeeder = require('./courseSeeder');
const departmentSeeder = require('./departmentSeeder');
const { seedComprehensiveData } = require('./comprehensiveDataSeeder');

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
      console.log(`
📖 Smart LMS Database Seeder Usage:

Run all seeders:     node seeders/index.js

Individual Seeder Usage:
-----------------------
node seeders/index.js --admin         - Seed admin users
node seeders/index.js --courses       - Seed courses
node seeders/index.js --departments   - Seed departments
node seeders/index.js --comprehensive - Seed all data (admin, departments, courses)

Available Commands:
--help, -h           Show this help message

Available Seeders:
- admin: Seed admin users
- courses: Seed course data
- departments: Seed department data
- comprehensive: Seed all data (admin, departments, courses)
      `);
      await mongoose.connection.close();
      process.exit(0);
    }
    
    if (args.includes('--admin')) {
      console.log('Running admin seeder...');
      await adminSeeder();
      console.log('✅ Admin seeder completed!');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    if (args.includes('--courses')) {
      console.log('Running courses seeder...');
      await courseSeeder();
      console.log('✅ Courses seeder completed!');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    if (args.includes('--departments')) {
      console.log('Running departments seeder...');
      await departmentSeeder.seedDepartments();
      console.log('✅ Departments seeder completed!');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    if (args.includes('--comprehensive')) {
      console.log('Running comprehensive seeder...');
      await seedComprehensiveData();
      console.log('✅ Comprehensive seeder completed!');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    // If no specific seeder is mentioned, run comprehensive seeder
    if (args.length === 0) {
      console.log('Running comprehensive seeder (departments + courses)...');
      await seedComprehensiveData();
      console.log('✅ All seeders completed!');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    console.log(`Unknown argument(s): ${args.join(', ')}\nUse --help to see available options.`);
    await mongoose.connection.close();
    process.exit(1);
    
  } catch (error) {
    console.error('❌ Error in seeder:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Run the seeder
if (require.main === module) {
  runSeeders();
}

module.exports = {
  runSeeders,
  adminSeeder,
  courseSeeder,
  departmentSeeder,
  seedComprehensiveData
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  console.log('\n⚠️  Process interrupted by user');
  try {
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error closing database connection:', err);
  }
  process.exit(0);
});

// Run the seeders
runSeeders();
