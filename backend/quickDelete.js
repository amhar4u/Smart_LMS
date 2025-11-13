/**
 * Quick Delete Submission Script
 * Usage: node quickDelete.js <submissionId>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const AssignmentSubmission = require('./models/AssignmentSubmission');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_lms';

async function deleteSubmission(submissionId) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const submission = await AssignmentSubmission.findById(submissionId);
    
    if (!submission) {
      console.log('❌ Submission not found');
      return;
    }

    console.log('Found submission:');
    console.log('  ID:', submission._id);
    console.log('  Assignment:', submission.assignmentId);
    console.log('  Student:', submission.studentId);
    console.log('  Submitted At:', submission.submittedAt || 'Not submitted');
    console.log('');

    await AssignmentSubmission.findByIdAndDelete(submissionId);
    
    console.log('✅ Submission deleted successfully!');
    console.log('   The student can now resubmit.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

const submissionId = process.argv[2];

if (!submissionId) {
  console.log('Usage: node quickDelete.js <submissionId>');
  console.log('Example: node quickDelete.js 691529f7f13daa4328da620d');
  process.exit(1);
}

deleteSubmission(submissionId);
