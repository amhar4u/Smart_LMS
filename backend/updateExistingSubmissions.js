const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { updateStudentSubjectLevel } = require('./services/studentSubjectLevelService');
const AssignmentSubmission = require('./models/AssignmentSubmission');
const Assignment = require('./models/Assignment');

// Load environment variables
dotenv.config();

// Database connection
const mongoOptions = {
  tls: true,
  tlsAllowInvalidCertificates: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

async function updateExistingSubmissions() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    console.log('✅ Connected to MongoDB\n');

    // Find all completed and evaluated submissions
    console.log('🔍 Finding evaluated submissions...');
    const submissions = await AssignmentSubmission.find({
      evaluationStatus: 'completed',
      marks: { $exists: true, $ne: null },
      percentage: { $exists: true, $ne: null }
    }).populate('assignmentId', 'subject');

    console.log(`📊 Found ${submissions.length} evaluated submissions\n`);

    if (submissions.length === 0) {
      console.log('ℹ️  No evaluated submissions found to update.');
      process.exit(0);
    }

    let successCount = 0;
    let errorCount = 0;
    const results = [];

    // Process each submission
    for (let i = 0; i < submissions.length; i++) {
      const submission = submissions[i];
      
      try {
        console.log(`\n[${i + 1}/${submissions.length}] Processing submission ${submission._id}`);
        console.log(`   Student: ${submission.studentId}`);
        console.log(`   Assignment: ${submission.assignmentId?._id || submission.assignmentId}`);
        console.log(`   Marks: ${submission.marks}/${submission.maxMarks || 'N/A'}`);
        console.log(`   Percentage: ${submission.percentage}%`);
        console.log(`   Level: ${submission.level || 'N/A'}`);

        // Get assignment details if not populated
        let assignmentId = submission.assignmentId;
        if (typeof assignmentId === 'object' && assignmentId._id) {
          assignmentId = assignmentId._id;
        }

        // Update student subject level
        const result = await updateStudentSubjectLevel(
          submission.studentId,
          assignmentId,
          submission.marks,
          submission.percentage,
          submission.level
        );

        console.log(`   ✅ Updated successfully`);
        console.log(`   Average: ${result.averagePercentage.toFixed(2)}%`);
        console.log(`   Level: ${result.level}`);
        console.log(`   Completed Assignments: ${result.completedAssignments}/${result.totalAssignments}`);
        
        successCount++;
        results.push({
          submissionId: submission._id,
          studentId: submission.studentId,
          status: 'success',
          averagePercentage: result.averagePercentage,
          level: result.level
        });

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errorCount++;
        results.push({
          submissionId: submission._id,
          studentId: submission.studentId,
          status: 'error',
          error: error.message
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Submissions: ${submissions.length}`);
    console.log(`✅ Successfully Updated: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

    // Show unique students updated
    const uniqueStudents = [...new Set(results
      .filter(r => r.status === 'success')
      .map(r => r.studentId.toString()))];
    console.log(`\n👥 Unique Students Updated: ${uniqueStudents.length}`);

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('🎉 Update complete!\n');

  } catch (error) {
    console.error('❌ Fatal Error:', error);
    process.exit(1);
  }
}

// Run the script
console.log('🚀 Starting Student Subject Level Update for Existing Submissions...\n');
updateExistingSubmissions();
