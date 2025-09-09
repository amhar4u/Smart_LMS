const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');
const Department = require('../models/Department');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    if (error.message.includes('IP')) {
      console.error('💡 Tip: Make sure your IP address is whitelisted in MongoDB Atlas');
      console.error('   Go to: Network Access > Add IP Address > Add Current IP Address');
    }
    
    if (error.message.includes('authentication')) {
      console.error('💡 Tip: Check your MongoDB username and password in .env file');
    }
    
    process.exit(1);
  }
};

// Admin seed data
const adminData = [
  {
    firstName: 'Super',
    lastName: 'Admin',
    email: 'admin@smartlms.com',
    password: 'admin123',
    phone: '+1234567890',
    role: 'admin',
    status: 'approved',
    isActive: true,
    employeeId: 'EMP-ADMIN-001',
    qualification: 'Masters in Computer Science',
    joinDate: new Date('2025-01-01'),
    address: {
      street: '123 Admin Street',
      city: 'Tech City',
      state: 'Tech State',
      zipCode: '12345',
      country: 'Tech Country'
    }
  }
];

// Hash passwords
const hashPasswords = async (data) => {
  const saltRounds = 12;
  for (let admin of data) {
    admin.password = await bcrypt.hash(admin.password, saltRounds);
  }
  return data;
};

// Seed function
const seedAdmins = async () => {
  try {
    console.log('🌱 Starting admin seeding process...');
    
    // Check if admins already exist
    const existingAdmins = await User.find({ role: 'admin' });
    
    if (existingAdmins.length > 0) {
      console.log('⚠️  Admin users already exist in the database:');
      existingAdmins.forEach(admin => {
        console.log(`   - ${admin.firstName} ${admin.lastName} (${admin.email})`);
      });
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      return new Promise((resolve) => {
        rl.question('Do you want to continue and add more admins? (y/N): ', (answer) => {
          rl.close();
          if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            seedAdminsData();
          } else {
            console.log('❌ Seeding cancelled by user');
            mongoose.connection.close();
            process.exit(0);
          }
        });
      });
    } else {
      await seedAdminsData();
    }
    
  } catch (error) {
    console.error('❌ Error during seeding process:', error);
    process.exit(1);
  }
};

const seedAdminsData = async () => {
  try {
    // Hash passwords
    const hashedAdminData = await hashPasswords([...adminData]);
    
    // Insert admin users
    const createdAdmins = await User.insertMany(hashedAdminData);
    
    console.log('✅ Successfully seeded admin users:');
    createdAdmins.forEach(admin => {
      console.log(`   - ${admin.firstName} ${admin.lastName} (${admin.email})`);
    });
    
    console.log('\n📋 Admin Login Credentials:');
    console.log('================================');
    adminData.forEach(admin => {
      console.log(`Email: ${admin.email}`);
      console.log(`Password: admin123`);
      console.log('--------------------------------');
    });
    
    console.log('\n🎉 Admin seeding completed successfully!');
    
  } catch (error) {
    if (error.code === 11000) {
      console.error('❌ Duplicate key error: Some admin users already exist');
      console.error('   Conflicting field:', Object.keys(error.keyPattern)[0]);
    } else {
      console.error('❌ Error creating admin users:', error.message);
    }
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

// Clear admins function
const clearAdmins = async () => {
  try {
    console.log('🗑️  Clearing all admin users...');
    
    const result = await User.deleteMany({ role: 'admin' });
    console.log(`✅ Deleted ${result.deletedCount} admin users`);
    
  } catch (error) {
    console.error('❌ Error clearing admin users:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  // Check command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--clear') || args.includes('-c')) {
    await clearAdmins();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📖 Smart LMS Admin Seeder Usage:
================================

Seed admins:     node seeders/adminSeeder.js
Clear admins:    node seeders/adminSeeder.js --clear
Show help:       node seeders/adminSeeder.js --help

Default admin credentials will be displayed after seeding.
    `);
    process.exit(0);
  } else {
    await seedAdmins();
  }
};

// Export the seedAdmins function for use in other seeders
module.exports = seedAdmins;

// Only run main if this file is executed directly
if (require.main === module) {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    mongoose.connection.close();
    process.exit(1);
  });

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('\n⚠️  Process interrupted by user');
    mongoose.connection.close();
    process.exit(0);
  });

  main();
}
