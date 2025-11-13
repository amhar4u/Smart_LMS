const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const AssignmentSubmission = require('./models/AssignmentSubmission');

async function deleteSubmissions() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_lms';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Delete all submissions for the specific assignment
    const assignmentId = '6915077a286195b201837eea';
    
    const result = await AssignmentSubmission.deleteMany({
      assignmentId: assignmentId
    });
    
    console.log(`✅ Deleted ${result.deletedCount} submissions for assignment ${assignmentId}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteSubmissions();
