const mongoose = require('mongoose');
const dotenv = require('dotenv');
const StudentSubjectLevel = require('./models/StudentSubjectLevel');
const User = require('./models/User');
const Subject = require('./models/Subject');

// Load environment variables
dotenv.config();

// Database connection
const mongoOptions = {
  tls: true,
  tlsAllowInvalidCertificates: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

async function verifyStudentLevels() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    console.log('✅ Connected to MongoDB\n');

    // Get all student subject levels
    const levels = await StudentSubjectLevel.find()
      .populate('studentId', 'firstName lastName email studentID')
      .populate('subjectId', 'name code')
      .sort({ averagePercentage: -1 });

    console.log('='.repeat(80));
    console.log('📊 STUDENT SUBJECT LEVELS REPORT');
    console.log('='.repeat(80));
    console.log(`Total Records: ${levels.length}\n`);

    levels.forEach((level, index) => {
      console.log(`\n[${index + 1}] Student: ${level.studentId?.firstName || 'N/A'} ${level.studentId?.lastName || ''}`);
      console.log(`    Email: ${level.studentId?.email || 'N/A'}`);
      console.log(`    Student ID: ${level.studentId?.studentID || 'N/A'}`);
      console.log(`    Subject: ${level.subjectId?.name || 'N/A'} (${level.subjectId?.code || 'N/A'})`);
      console.log(`    ─────────────────────────────────────────────────────────────`);
      console.log(`    Average Marks: ${level.averageMarks.toFixed(2)}`);
      console.log(`    Average Percentage: ${level.averagePercentage.toFixed(2)}%`);
      console.log(`    Current Level: ${level.level.toUpperCase()}`);
      console.log(`    Completed Assignments: ${level.completedAssignments}`);
      console.log(`    Total Assignments: ${level.totalAssignments}`);
      console.log(`    Total Marks Obtained: ${level.totalMarksObtained}`);
      console.log(`    Total Max Marks: ${level.totalMaxMarks}`);
      console.log(`    Last Assignment: ${level.lastAssignmentDate?.toLocaleDateString() || 'N/A'}`);
      
      if (level.performanceHistory && level.performanceHistory.length > 0) {
        console.log(`\n    📈 Performance History (${level.performanceHistory.length} assignments):`);
        level.performanceHistory.forEach((perf, i) => {
          console.log(`       ${i + 1}. Marks: ${perf.marks} | Percentage: ${perf.percentage}% | Level: ${perf.level} | Date: ${perf.submittedAt?.toLocaleDateString()}`);
        });
      }

      if (level.levelChanges && level.levelChanges.length > 0) {
        console.log(`\n    🎯 Level Changes (${level.levelChanges.length}):`);
        level.levelChanges.forEach((change, i) => {
          console.log(`       ${i + 1}. ${change.previousLevel} → ${change.newLevel} on ${change.changedAt?.toLocaleDateString()}`);
        });
      }

      console.log(`    ─────────────────────────────────────────────────────────────`);
    });

    // Summary by level
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY BY LEVEL');
    console.log('='.repeat(80));
    
    const beginners = levels.filter(l => l.level === 'beginner');
    const intermediates = levels.filter(l => l.level === 'intermediate');
    const advanced = levels.filter(l => l.level === 'advanced');

    console.log(`🔴 Beginner (< 35%): ${beginners.length} students`);
    if (beginners.length > 0) {
      const avgBeginner = beginners.reduce((sum, l) => sum + l.averagePercentage, 0) / beginners.length;
      console.log(`   Average Percentage: ${avgBeginner.toFixed(2)}%`);
    }

    console.log(`\n🟡 Intermediate (35-70%): ${intermediates.length} students`);
    if (intermediates.length > 0) {
      const avgIntermediate = intermediates.reduce((sum, l) => sum + l.averagePercentage, 0) / intermediates.length;
      console.log(`   Average Percentage: ${avgIntermediate.toFixed(2)}%`);
    }

    console.log(`\n🟢 Advanced (> 70%): ${advanced.length} students`);
    if (advanced.length > 0) {
      const avgAdvanced = advanced.reduce((sum, l) => sum + l.averagePercentage, 0) / advanced.length;
      console.log(`   Average Percentage: ${avgAdvanced.toFixed(2)}%`);
    }

    console.log('\n' + '='.repeat(80));

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
verifyStudentLevels();
