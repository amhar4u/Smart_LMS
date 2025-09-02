const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import seeders
const adminSeeder = require('./adminSeeder');
const courseSeeder = require('./courseSeeder');
const departmentSeeder = require('./departmentSeeder');
const semesterSeeder = require('./semesterSeeder');

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
node seeders/index.js --semesters     - Seed semesters

Available Commands:
--help, -h           Show this help message

Available Seeders:
- admin: Seed admin users
- courses: Seed course data
- departments: Seed department data
- semesters: Seed semester data
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
    
    if (args.includes('--semesters')) {
      console.log('Running semesters seeder...');
      await semesterSeeder.seedSemesters();
      console.log('✅ Semesters seeder completed!');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    // If no specific seeder is mentioned, run all
    if (args.length === 0) {
      console.log('Running all seeders...');
      console.log('\n1. Seeding departments...');
      await departmentSeeder.seedDepartments();
      
      console.log('\n2. Seeding semesters...');
      await semesterSeeder.seedSemesters();
      
      console.log('\n3. Seeding admin users...');
      await adminSeeder();
      
      console.log('\n4. Seeding courses...');
      await courseSeeder();
      
      console.log('\n✅ All seeders completed successfully!');
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
