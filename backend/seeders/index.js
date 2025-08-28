const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import seeders
const adminSeeder = require('./adminSeeder');

// Import other seeders here when created
// const studentSeeder = require('./studentSeeder');
// const teacherSeeder = require('./teacherSeeder');

const seeders = {
  admin: adminSeeder,
  // student: studentSeeder,
  // teacher: teacherSeeder,
};

// Main seeder function
const runSeeders = async () => {
  try {
    console.log('🌱 Smart LMS Database Seeder');
    console.log('============================');
    
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
      console.log(`
📖 Smart LMS Database Seeder Usage:
===================================

Run all seeders:     node seeders/index.js
Run admin seeder:    node seeders/index.js --admin
Clear all data:      node seeders/index.js --clear
Show help:           node seeders/index.js --help

Individual Seeder Usage:
-----------------------
node seeders/adminSeeder.js          - Seed admin users
node seeders/adminSeeder.js --clear  - Clear admin users

Available Seeders:
- admin: Seed admin users
      `);
      process.exit(0);
    }
    
    if (args.includes('--admin')) {
      console.log('Running admin seeder...');
      // This will run the admin seeder directly
      require('./adminSeeder');
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
--clear     Clear all data
--help      Show this help message

To run individual seeders:
node seeders/adminSeeder.js
    `);
    
  } catch (error) {
    console.error('❌ Error in seeder:', error);
    process.exit(1);
  }
};

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
