require('dotenv').config();
const mongoose = require('mongoose');

async function fixAttendanceIndex() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const attendancesCollection = db.collection('attendances');

    console.log('='.repeat(80));
    console.log('🔍 DIAGNOSING ATTENDANCE INDEX ISSUE');
    console.log('='.repeat(80) + '\n');

    // Step 1: Check current indexes
    console.log('📋 Current indexes:');
    const indexes = await attendancesCollection.indexes();
    indexes.forEach(index => {
      console.log(`   - ${JSON.stringify(index.key)} (${index.name})`);
    });
    console.log('');

    // Step 2: Find documents with null meetingId or studentId
    console.log('🔍 Finding corrupted documents with null values...');
    const nullDocs = await attendancesCollection.find({
      $or: [
        { meetingId: null },
        { studentId: null },
        { meeting: { $exists: true } },
        { student: { $exists: true } }
      ]
    }).toArray();

    console.log(`   Found ${nullDocs.length} problematic documents\n`);

    if (nullDocs.length > 0) {
      console.log('📝 Problematic documents:');
      nullDocs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ID: ${doc._id}`);
        console.log(`      meetingId: ${doc.meetingId || 'NULL'}`);
        console.log(`      studentId: ${doc.studentId || 'NULL'}`);
        console.log(`      meeting: ${doc.meeting || 'N/A'}`);
        console.log(`      student: ${doc.student || 'N/A'}`);
      });
      console.log('');

      // Delete corrupted documents
      console.log('🗑️  Deleting corrupted documents...');
      const deleteResult = await attendancesCollection.deleteMany({
        $or: [
          { meetingId: null },
          { studentId: null },
          { meeting: { $exists: true } },
          { student: { $exists: true } }
        ]
      });
      console.log(`   ✅ Deleted ${deleteResult.deletedCount} documents\n`);
    }

    // Step 3: Drop old/incorrect indexes
    console.log('🗑️  Dropping old indexes...');
    try {
      // Drop the problematic index if it exists
      await attendancesCollection.dropIndex('meeting_1_student_1');
      console.log('   ✅ Dropped meeting_1_student_1 index');
    } catch (err) {
      if (err.code === 27) {
        console.log('   ℹ️  Index meeting_1_student_1 does not exist (already dropped)');
      } else {
        console.log('   ⚠️  Could not drop index:', err.message);
      }
    }

    try {
      // Also drop the correct index name if it exists (we'll recreate it)
      await attendancesCollection.dropIndex('meetingId_1_studentId_1');
      console.log('   ✅ Dropped meetingId_1_studentId_1 index');
    } catch (err) {
      if (err.code === 27) {
        console.log('   ℹ️  Index meetingId_1_studentId_1 does not exist');
      } else {
        console.log('   ⚠️  Could not drop index:', err.message);
      }
    }
    console.log('');

    // Step 4: Create correct unique index
    console.log('✨ Creating correct unique index...');
    await attendancesCollection.createIndex(
      { meetingId: 1, studentId: 1 },
      { unique: true, name: 'meetingId_1_studentId_1' }
    );
    console.log('   ✅ Created index: meetingId_1_studentId_1 (unique)\n');

    // Step 5: Verify new indexes
    console.log('📋 Updated indexes:');
    const newIndexes = await attendancesCollection.indexes();
    newIndexes.forEach(index => {
      console.log(`   - ${JSON.stringify(index.key)} (${index.name})`);
    });
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ ATTENDANCE INDEX FIX COMPLETED');
    console.log('='.repeat(80));
    console.log('You can now join meetings and attendance will be recorded properly.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

fixAttendanceIndex();
