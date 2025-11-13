require('dotenv').config();
const mongoose = require('mongoose');
const AssignmentSubmission = require('./models/AssignmentSubmission');

async function deleteSubmission() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // The submission ID from your screenshot
    const submissionId = '6914cb4fea057672971c82c1';
    
    const result = await AssignmentSubmission.findByIdAndDelete(submissionId);
    
    if (result) {
      console.log('✅ Submission deleted successfully:', submissionId);
      console.log('Student ID:', result.studentId);
      console.log('Assignment ID:', result.assignmentId);
    } else {
      console.log('❌ Submission not found');
    }

    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteSubmission();
