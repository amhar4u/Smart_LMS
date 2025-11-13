/**
 * Script to diagnose and fix assignment submission issues
 * - Find submissions with empty answers arrays
 * - Find duplicate submissions
 * - Clean up problematic records
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_lms';

async function diagnoseSubmissions() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('assignmentsubmissions');

    // Count total submissions
    const totalCount = await collection.countDocuments();
    console.log(`📊 Total submissions: ${totalCount}\n`);

    // Find submissions with empty answers
    console.log('🔍 Finding submissions with empty answers array...');
    const emptyAnswers = await collection.find({
      $or: [
        { submittedAnswers: { $exists: false } },
        { submittedAnswers: { $size: 0 } },
        { submittedAnswers: [] }
      ]
    }).toArray();

    console.log(`Found ${emptyAnswers.length} submissions with empty answers:`);
    emptyAnswers.forEach((sub, i) => {
      console.log(`  ${i + 1}. Submission ID: ${sub._id}`);
      console.log(`     Student: ${sub.studentId}`);
      console.log(`     Assignment: ${sub.assignmentId}`);
      console.log(`     Submitted At: ${sub.submittedAt}`);
      console.log(`     Answers: ${sub.submittedAnswers ? sub.submittedAnswers.length : 'undefined'}`);
      console.log('');
    });

    // Find duplicate submissions (same student + assignment)
    console.log('\n🔍 Finding duplicate submissions...');
    const duplicates = await collection.aggregate([
      {
        $group: {
          _id: {
            studentId: '$studentId',
            assignmentId: '$assignmentId'
          },
          count: { $sum: 1 },
          ids: { $push: '$_id' },
          submittedAts: { $push: '$submittedAt' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray();

    console.log(`Found ${duplicates.length} cases of duplicate submissions:`);
    duplicates.forEach((dup, i) => {
      console.log(`  ${i + 1}. Student: ${dup._id.studentId}, Assignment: ${dup._id.assignmentId}`);
      console.log(`     Count: ${dup.count} submissions`);
      console.log(`     IDs: ${dup.ids.join(', ')}`);
      console.log('');
    });

    // Ask if user wants to clean up
    console.log('\n=== CLEANUP OPTIONS ===');
    console.log('Would you like to:');
    console.log('1. Delete all submissions with empty answers? (Type "delete-empty")');
    console.log('2. Keep only latest submission for duplicates? (Type "keep-latest")');
    console.log('3. Exit without changes (Type "exit")');
    console.log('\nNote: This script will just show what would be deleted.');
    console.log('To actually delete, uncomment the deletion lines in the script.\n');

    // Simulate cleanup of empty answers
    if (emptyAnswers.length > 0) {
      console.log('\n🧹 Simulating cleanup of empty answer submissions:');
      console.log(`Would delete ${emptyAnswers.length} submissions`);
      // Uncomment below to actually delete:
      // const deleteResult = await collection.deleteMany({
      //   _id: { $in: emptyAnswers.map(s => s._id) }
      // });
      // console.log(`✅ Deleted ${deleteResult.deletedCount} submissions with empty answers`);
    }

    // Simulate cleanup of duplicates (keep only the latest)
    if (duplicates.length > 0) {
      console.log('\n🧹 Simulating cleanup of duplicate submissions:');
      let totalToDelete = 0;
      for (const dup of duplicates) {
        // Sort by submittedAt, keep the latest
        const sorted = dup.ids.map((id, idx) => ({
          id: id,
          submittedAt: dup.submittedAts[idx]
        })).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

        const toDelete = sorted.slice(1); // Keep first (latest), delete rest
        totalToDelete += toDelete.length;
        
        console.log(`  - For student ${dup._id.studentId}, assignment ${dup._id.assignmentId}:`);
        console.log(`    Keep: ${sorted[0].id} (${sorted[0].submittedAt})`);
        console.log(`    Delete: ${toDelete.map(d => d.id).join(', ')}`);
        
        // Uncomment below to actually delete:
        // await collection.deleteMany({
        //   _id: { $in: toDelete.map(d => d.id) }
        // });
      }
      console.log(`\nWould delete ${totalToDelete} duplicate submissions`);
    }

    console.log('\n✅ Diagnosis completed!');
    console.log('\n⚠️  To actually perform deletions, edit this script and uncomment the deletion lines.');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the diagnosis
console.log('=== Assignment Submission Diagnosis Tool ===\n');
diagnoseSubmissions();
