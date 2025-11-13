const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const AssignmentSubmission = require('./models/AssignmentSubmission');

async function checkSubmission() {
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

    console.log('\n=== SUBMISSION DETAILS ===');
    console.log('ID:', submission._id);
    console.log('Assignment ID:', submission.assignmentId);
    console.log('Student ID:', submission.studentId);
    console.log('Status:', submission.status);
    console.log('Evaluation Status:', submission.evaluationStatus);
    console.log('Submitted At:', submission.submittedAt);
    
    console.log('\n=== SUBMITTED ANSWERS ===');
    console.log('Number of answers:', submission.submittedAnswers?.length || 0);
    
    if (submission.submittedAnswers && submission.submittedAnswers.length > 0) {
      submission.submittedAnswers.forEach((answer, index) => {
        console.log(`\nAnswer ${index + 1}:`);
        console.log('  Question ID:', answer.questionId);
        console.log('  Question Text:', answer.questionText?.substring(0, 100) + '...');
        console.log('  Type:', answer.type);
        console.log('  Answer:', answer.answer?.substring(0, 100) || 'N/A');
        console.log('  Selected Option:', answer.selectedOption || 'N/A');
        console.log('  Has Question Details:', !!answer.questionDetails);
        if (answer.questionDetails) {
          console.log('    - Correct Answer:', answer.questionDetails.correctAnswer?.substring(0, 50));
          console.log('    - Marks:', answer.questionDetails.marks);
        }
      });
    } else {
      console.log('NO ANSWERS FOUND!');
      console.log('Full submission object:', JSON.stringify(submission, null, 2));
    }

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSubmission();
