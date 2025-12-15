require('dotenv').config();
const mongoose = require('mongoose');

async function cleanupLegacyIndexes() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const db = mongoose.connection.db;
    const collection = db.collection('attendances');

    console.log('🗑️  Removing legacy indexes...\n');

    const legacyIndexes = ['meeting_1', 'student_1', 'joinTime_1'];
    
    for (const indexName of legacyIndexes) {
      try {
        await collection.dropIndex(indexName);
        console.log(`   ✅ Dropped ${indexName}`);
      } catch (err) {
        if (err.code === 27) {
          console.log(`   ℹ️  ${indexName} doesn't exist (skipped)`);
        } else {
          console.log(`   ⚠️  Error dropping ${indexName}:`, err.message);
        }
      }
    }

    console.log('\n📋 Final indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`   - ${JSON.stringify(index.key)} (${index.name})`);
    });

    console.log('\n✅ Cleanup complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

cleanupLegacyIndexes();
