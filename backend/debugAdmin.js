const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function debugAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find admin user
    const admin = await User.findOne({ email: 'admin@smartlms.com' }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin user not found');
      await mongoose.disconnect();
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log('Email:', admin.email);
    console.log('Password hash length:', admin.password.length);
    console.log('Password starts with:', admin.password.substring(0, 15));
    console.log('Is active:', admin.isActive);
    console.log('Status:', admin.status);
    
    // Test different passwords
    const passwords = ['admin123', 'Admin123', 'admin', 'password'];
    
    for (const pwd of passwords) {
      try {
        const isValid = await admin.comparePassword(pwd);
        console.log(`Password '${pwd}': ${isValid}`);
      } catch (error) {
        console.log(`Password '${pwd}': ERROR - ${error.message}`);
      }
    }
    
    // Also test with direct bcrypt
    const directTest = await bcrypt.compare('admin123', admin.password);
    console.log('Direct bcrypt test with admin123:', directTest);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugAdmin();
