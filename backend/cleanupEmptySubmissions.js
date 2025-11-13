require('dotenv').config();
const mongoose = require('mongoose');
const AssignmentSubmission = require('./models/AssignmentSubmission');

async function cleanupEmptySubmissions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all submissions with empty submittedAnswers
    const emptySubmissions = await AssignmentSubmission.find({
      $or: [
        { submittedAnswers: { $exists: false } },
        { submittedAnswers: { $size: 0 } },
        { submittedAnswers: [] }
      ]
    });

    console.log(`Found ${emptySubmissions.length} submissions with empty answers`);

    if (emptySubmissions.length > 0) {
      console.log('\nSubmissions to delete:');
      emptySubmissions.forEach(sub => {
        console.log(`- ID: ${sub._id}, Assignment: ${sub.assignmentId}, Student: ${sub.studentId}, Status: ${sub.evaluationStatus}`);
      });

      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      readline.question('\nDo you want to delete these submissions? (yes/no): ', async (answer) => {
        if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
          const result = await AssignmentSubmission.deleteMany({
            $or: [
              { submittedAnswers: { $exists: false } },
              { submittedAnswers: { $size: 0 } },
              { submittedAnswers: [] }
            ]
          });

          console.log(`\n✅ Deleted ${result.deletedCount} submissions`);
        } else {
          console.log('\n❌ Cancelled. No submissions deleted.');
        }

        readline.close();
        await mongoose.connection.close();
        console.log('👋 Disconnected from MongoDB');
      });
    } else {
      console.log('\n✅ No empty submissions found. All good!');
      await mongoose.connection.close();
      console.log('👋 Disconnected from MongoDB');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupEmptySubmissions();
