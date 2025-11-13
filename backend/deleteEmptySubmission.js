const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const AssignmentSubmission = require('./models/AssignmentSubmission');

async function deleteEmptySubmission() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_lms';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const submissionId = '6914ee824b15dd420b57e4c0';
    
    const submission = await AssignmentSubmission.findById(submissionId);
    if (!submission) {
      console.log('Submission not found');
      return;
    }

    console.log('\n=== DELETING EMPTY SUBMISSION ===');
    console.log('Submission ID:', submission._id);
    console.log('Assignment ID:', submission.assignmentId);
    console.log('Student ID:', submission.studentId);
    console.log('Answers count:', submission.submittedAnswers.length);
    console.log('Status:', submission.status);

    await AssignmentSubmission.findByIdAndDelete(submissionId);
    console.log('\n✅ Empty submission deleted successfully!');
    console.log('The student can now retake and submit the assignment properly.');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteEmptySubmission();
