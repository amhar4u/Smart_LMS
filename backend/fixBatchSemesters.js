require('dotenv').config();
const mongoose = require('mongoose');
const Semester = require('./models/Semester');
const Batch = require('./models/Batch');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_lms');
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Fix batch-semester relationships
const fixBatchSemesters = async () => {
  try {
    console.log('\n🔧 Starting batch-semester relationship fix...\n');

    // Get all semesters
    const semesters = await Semester.find({}).populate('batch');
    console.log(`📚 Found ${semesters.length} semesters in database`);

    let updatedCount = 0;
    let alreadyLinkedCount = 0;

    for (const semester of semesters) {
      if (!semester.batch) {
        console.log(`⚠️  Semester "${semester.name}" (${semester.code}) has no batch assigned - skipping`);
        continue;
      }

      // Get the batch
      const batch = await Batch.findById(semester.batch._id);
      
      if (!batch) {
        console.log(`❌ Batch not found for semester "${semester.name}" (${semester.code})`);
        continue;
      }

      // Check if semester is already in batch's semesters array
      const semesterExists = batch.semesters.some(
        semId => semId.toString() === semester._id.toString()
      );

      if (semesterExists) {
        console.log(`✓ Semester "${semester.name}" already linked to batch "${batch.name}"`);
        alreadyLinkedCount++;
        continue;
      }

      // Add semester to batch's semesters array
      batch.semesters.push(semester._id);
      await batch.save();

      console.log(`✅ Added semester "${semester.name}" to batch "${batch.name}"`);
      updatedCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Total semesters processed: ${semesters.length}`);
    console.log(`   Already linked: ${alreadyLinkedCount}`);
    console.log(`   Newly linked: ${updatedCount}`);
    console.log('='.repeat(60) + '\n');

    if (updatedCount > 0) {
      console.log('✅ Batch-semester relationships fixed successfully!');
    } else if (alreadyLinkedCount === semesters.length) {
      console.log('✅ All semester-batch relationships are already correct!');
    }

  } catch (error) {
    console.error('❌ Error fixing batch-semester relationships:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await fixBatchSemesters();
  
  console.log('\n✅ Script completed. Closing database connection...');
  await mongoose.connection.close();
  console.log('👋 Database connection closed. Goodbye!\n');
  process.exit(0);
};

// Run the script
main();
