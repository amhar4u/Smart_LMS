/**
 * Script to clean up submissions with empty answers
 * Run this to fix corrupted submissions
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_lms';

async function cleanupEmptySubmissions() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('assignmentsubmissions');

    // Find submissions with empty answers
    console.log('🔍 Finding submissions with empty answers array...');
    const emptyAnswers = await collection.find({
      $or: [
        { submittedAnswers: { $exists: false } },
        { submittedAnswers: { $size: 0 } },
        { submittedAnswers: [] }
      ]
    }).toArray();

    console.log(`Found ${emptyAnswers.length} submissions with empty answers\n`);

    if (emptyAnswers.length === 0) {
      console.log('✅ No problematic submissions found!');
    } else {
      console.log('📋 Details of submissions to be deleted:');
      emptyAnswers.forEach((sub, i) => {
        console.log(`  ${i + 1}. ID: ${sub._id}`);
        console.log(`     Student: ${sub.studentId}`);
        console.log(`     Assignment: ${sub.assignmentId}`);
        console.log(`     Submitted At: ${sub.submittedAt}`);
        console.log('');
      });

      console.log('🗑️  Deleting submissions with empty answers...');
      const deleteResult = await collection.deleteMany({
        _id: { $in: emptyAnswers.map(s => s._id) }
      });

      console.log(`✅ Successfully deleted ${deleteResult.deletedCount} submissions`);
      console.log('\n💡 Students can now resubmit these assignments with proper answers!');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the cleanup
console.log('=== Cleanup Empty Submissions ===\n');
cleanupEmptySubmissions();
