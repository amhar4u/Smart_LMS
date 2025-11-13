/**
 * Cleanup Script for Assignment Submissions
 * 
 * This script helps clean up stuck or problematic submissions
 * 
 * Options:
 * 1. Remove submissions that are started but never submitted (older than X hours)
 * 2. Remove duplicate submissions (shouldn't exist but just in case)
 * 3. Reset specific student's submission for an assignment
 * 
 * Usage: node cleanupSubmissions.js <option> [parameters]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const AssignmentSubmission = require('./models/AssignmentSubmission');
const readline = require('readline');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_lms';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function removeOldStartedSubmissions(hoursOld = 24) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const cutoffDate = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
    
    // Find submissions that were started but never submitted
    const submissions = await AssignmentSubmission.find({
      startedAt: { $lt: cutoffDate },
      submittedAt: null
    });

    console.log(`Found ${submissions.length} submissions started but not submitted (older than ${hoursOld} hours)\n`);

    if (submissions.length === 0) {
      console.log('No submissions to clean up.');
      return;
    }

    // Show details
    submissions.forEach((sub, i) => {
      console.log(`${i + 1}. Assignment: ${sub.assignmentId}, Student: ${sub.studentId}`);
      console.log(`   Started: ${sub.startedAt.toLocaleString()}`);
    });

    const confirm = await question('\nDo you want to delete these submissions? (yes/no): ');
    
    if (confirm.toLowerCase() === 'yes') {
      const result = await AssignmentSubmission.deleteMany({
        startedAt: { $lt: cutoffDate },
        submittedAt: null
      });
      
      console.log(`\n✅ Deleted ${result.deletedCount} submissions`);
      console.log('These students can now resubmit their assignments.');
    } else {
      console.log('Cancelled.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    rl.close();
  }
}

async function resetStudentSubmission(assignmentId, studentId) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const submission = await AssignmentSubmission.findOne({
      assignmentId: assignmentId,
      studentId: studentId
    });

    if (!submission) {
      console.log('❌ No submission found for this student and assignment.');
      return;
    }

    console.log('Found submission:');
    console.log('   ID:', submission._id);
    console.log('   Started:', submission.startedAt?.toLocaleString());
    console.log('   Submitted:', submission.submittedAt?.toLocaleString() || 'Not submitted');
    console.log('   Status:', submission.evaluationStatus);
    console.log('   Marks:', submission.marks ?? 'Not graded');

    const confirm = await question('\nDelete this submission? (yes/no): ');
    
    if (confirm.toLowerCase() === 'yes') {
      await AssignmentSubmission.findByIdAndDelete(submission._id);
      console.log('\n✅ Submission deleted successfully!');
      console.log('The student can now resubmit the assignment.');
    } else {
      console.log('Cancelled.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    rl.close();
  }
}

async function findDuplicates() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find duplicates using aggregation
    const duplicates = await AssignmentSubmission.aggregate([
      {
        $group: {
          _id: {
            assignmentId: '$assignmentId',
            studentId: '$studentId'
          },
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    console.log(`Found ${duplicates.length} duplicate submission pairs\n`);

    if (duplicates.length === 0) {
      console.log('No duplicates found.');
      return;
    }

    // Show duplicates
    duplicates.forEach((dup, i) => {
      console.log(`${i + 1}. Assignment: ${dup._id.assignmentId}, Student: ${dup._id.studentId}`);
      console.log(`   Count: ${dup.count}`);
      console.log(`   IDs: ${dup.ids.join(', ')}`);
    });

    console.log('\n⚠️  WARNING: Duplicates should not exist due to unique index!');
    console.log('This might indicate a database integrity issue.');
    console.log('Please investigate manually or contact support.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    rl.close();
  }
}

async function showMenu() {
  console.log('\n=== Assignment Submission Cleanup Tool ===\n');
  console.log('1. Remove old started (but not submitted) submissions');
  console.log('2. Reset specific student submission');
  console.log('3. Check for duplicate submissions');
  console.log('4. Exit\n');

  const choice = await question('Select option (1-4): ');

  switch (choice) {
    case '1':
      const hours = await question('Remove submissions older than how many hours? (default 24): ');
      await removeOldStartedSubmissions(parseInt(hours) || 24);
      break;

    case '2':
      const assignmentId = await question('Enter Assignment ID: ');
      const studentId = await question('Enter Student ID: ');
      await resetStudentSubmission(assignmentId, studentId);
      break;

    case '3':
      await findDuplicates();
      break;

    case '4':
      console.log('Goodbye!');
      rl.close();
      process.exit(0);
      break;

    default:
      console.log('Invalid option');
      rl.close();
      break;
  }
}

// Check if run with arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  // Interactive mode
  showMenu();
} else {
  // Command line mode
  const command = args[0];
  
  switch (command) {
    case 'old':
      const hours = parseInt(args[1]) || 24;
      removeOldStartedSubmissions(hours);
      break;

    case 'reset':
      if (args.length < 3) {
        console.log('Usage: node cleanupSubmissions.js reset <assignmentId> <studentId>');
        process.exit(1);
      }
      resetStudentSubmission(args[1], args[2]);
      break;

    case 'duplicates':
      findDuplicates();
      break;

    default:
      console.log('Usage:');
      console.log('  node cleanupSubmissions.js                              # Interactive mode');
      console.log('  node cleanupSubmissions.js old [hours]                  # Remove old submissions');
      console.log('  node cleanupSubmissions.js reset <assignmentId> <studentId>  # Reset specific submission');
      console.log('  node cleanupSubmissions.js duplicates                   # Check for duplicates');
      rl.close();
      break;
  }
}
