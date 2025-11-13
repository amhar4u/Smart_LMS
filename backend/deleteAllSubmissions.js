/**
 * Delete ALL submissions to start fresh
 * Use this to completely reset submissions
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_lms';

async function deleteAllSubmissions() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('assignmentsubmissions');

    // Count before deletion
    const countBefore = await collection.countDocuments();
    console.log(`📊 Total submissions in database: ${countBefore}\n`);

    if (countBefore === 0) {
      console.log('✅ No submissions found. Database is already clean!');
    } else {
      // Show all submissions
      console.log('📋 All submissions:');
      const allSubs = await collection.find({}).toArray();
      allSubs.forEach((sub, i) => {
        console.log(`  ${i + 1}. ID: ${sub._id}`);
        console.log(`     Student: ${sub.studentId}`);
        console.log(`     Assignment: ${sub.assignmentId}`);
        console.log(`     Submitted At: ${sub.submittedAt}`);
        console.log(`     Started At: ${sub.startedAt}`);
        console.log(`     Answers: ${sub.submittedAnswers ? sub.submittedAnswers.length : 0}`);
        console.log('');
      });

      console.log('🗑️  Deleting ALL submissions...');
      const deleteResult = await collection.deleteMany({});

      console.log(`✅ Successfully deleted ${deleteResult.deletedCount} submissions`);
      console.log('\n💡 Database is now clean. Students can submit fresh!');
    }

  } catch (error) {
    console.error('❌ Error during deletion:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the cleanup
console.log('=== DELETE ALL SUBMISSIONS ===\n');
console.log('⚠️  WARNING: This will delete ALL submissions in the database!\n');
deleteAllSubmissions();
