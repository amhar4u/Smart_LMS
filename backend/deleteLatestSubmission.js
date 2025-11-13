const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const AssignmentSubmission = require('./models/AssignmentSubmission');

async function deleteSubmission() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_lms';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const submissionId = '6914f32041c55b9e9cb7249f';
    const result = await AssignmentSubmission.findByIdAndDelete(submissionId);
    
    if (result) {
      console.log('✅ Deleted submission:', submissionId);
      console.log('Student ID:', result.studentId);
      console.log('Assignment ID:', result.assignmentId);
    } else {
      console.log('❌ Submission not found');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteSubmission();
