/**
 * Script to fix the unique index issue on AssignmentSubmission collection
 * This removes the unique constraint to allow resubmission after deletion
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_lms';

async function fixUniqueIndex() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('assignmentsubmissions');

    console.log('📋 Checking existing indexes...');
    const indexes = await collection.indexes();
    
    console.log('\nCurrent indexes:');
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${JSON.stringify(index.key)} - ${index.unique ? 'UNIQUE' : 'NON-UNIQUE'}`);
    });

    // Find the unique compound index
    const uniqueIndex = indexes.find(idx => 
      idx.key.assignmentId === 1 && 
      idx.key.studentId === 1 && 
      idx.unique === true
    );

    if (uniqueIndex) {
      console.log('\n⚠️  Found unique compound index:', uniqueIndex.name);
      console.log('🗑️  Dropping unique index...');
      
      await collection.dropIndex(uniqueIndex.name);
      console.log('✅ Unique index dropped successfully');

      // Create non-unique index for performance
      console.log('📊 Creating non-unique compound index...');
      await collection.createIndex(
        { assignmentId: 1, studentId: 1 },
        { unique: false, background: true }
      );
      console.log('✅ Non-unique index created successfully');
    } else {
      console.log('\n✅ No unique compound index found - already fixed or doesn\'t exist');
    }

    console.log('\n📋 Updated indexes:');
    const updatedIndexes = await collection.indexes();
    updatedIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${JSON.stringify(index.key)} - ${index.unique ? 'UNIQUE' : 'NON-UNIQUE'}`);
    });

    console.log('\n✅ Index fix completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing index:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the fix
console.log('=== Assignment Submission Index Fix ===\n');
fixUniqueIndex();
