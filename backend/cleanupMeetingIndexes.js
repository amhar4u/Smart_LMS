const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_lms';

async function cleanupOldIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('meetings');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // List of old indexes to remove (from previous Jitsi implementation)
    const oldIndexes = [
      'meetingId_1',
      'jitsiRoomName_1',
      'scheduledDate_1_status_1',
      'department_1_course_1_batch_1',
      'host_1_status_1',
      'moduleId_1',
      'date_1'
    ];

    console.log('\n🧹 Cleaning up old indexes...');
    
    for (const indexName of oldIndexes) {
      try {
        await collection.dropIndex(indexName);
        console.log(`  ✅ Dropped: ${indexName}`);
      } catch (error) {
        if (error.code === 27) {
          console.log(`  ⚠️  Not found: ${indexName}`);
        } else {
          console.log(`  ❌ Error dropping ${indexName}:`, error.message);
        }
      }
    }

    // Get updated indexes
    const updatedIndexes = await collection.indexes();
    console.log('\n📋 Remaining indexes (should only be Daily.co related):');
    updatedIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✅ Database cleanup completed successfully!');
    console.log('🎉 You can now create meetings without errors!');
    
  } catch (error) {
    console.error('❌ Error cleaning up indexes:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the cleanup
cleanupOldIndexes();
