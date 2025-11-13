const StudentSubjectLevel = require('../models/StudentSubjectLevel');
const Assignment = require('../models/Assignment');

/**
 * Update student's subject level performance after assignment evaluation
 * @param {String} studentId - Student's user ID
 * @param {String} assignmentId - Assignment ID
 * @param {Number} marks - Marks obtained
 * @param {Number} percentage - Percentage obtained
 * @param {String} level - Student level (beginner/intermediate/advanced)
 */
async function updateStudentSubjectLevel(studentId, assignmentId, marks, percentage, level) {
  try {
    // Get assignment to find the subject
    const assignment = await Assignment.findById(assignmentId).select('subject maxMarks');
    
    if (!assignment || !assignment.subject) {
      console.log('⚠️ Assignment or subject not found, skipping level update');
      return null;
    }

    const subjectId = assignment.subject;
    const maxMarks = assignment.maxMarks;

    // Find or create student subject level record
    let studentSubjectLevel = await StudentSubjectLevel.findOne({
      studentId,
      subjectId
    });

    if (!studentSubjectLevel) {
      // Create new record
      studentSubjectLevel = new StudentSubjectLevel({
        studentId,
        subjectId,
        totalAssignments: 0,
        completedAssignments: 0,
        totalMarksObtained: 0,
        totalMaxMarks: 0,
        averageMarks: 0,
        averagePercentage: 0,
        level: 'beginner',
        performanceHistory: [],
        levelChanges: []
      });
      console.log(`✨ Created new StudentSubjectLevel record for student ${studentId} in subject ${subjectId}`);
    }

    // Check if this assignment is already in performance history
    const existingIndex = studentSubjectLevel.performanceHistory.findIndex(
      item => item.assignmentId && item.assignmentId.toString() === assignmentId.toString()
    );

    if (existingIndex >= 0) {
      // Update existing entry
      const oldMarks = studentSubjectLevel.performanceHistory[existingIndex].marks;
      const oldPercentage = studentSubjectLevel.performanceHistory[existingIndex].percentage;
      
      // Remove old marks from totals
      studentSubjectLevel.totalMarksObtained -= oldMarks;
      
      // Update the history entry
      studentSubjectLevel.performanceHistory[existingIndex] = {
        assignmentId,
        marks,
        percentage,
        level,
        completedAt: new Date()
      };
      
      // Add new marks
      studentSubjectLevel.totalMarksObtained += marks;
      
      console.log(`📝 Updated existing assignment in performance history (was ${oldPercentage}%, now ${percentage}%)`);
    } else {
      // Add new entry
      studentSubjectLevel.performanceHistory.push({
        assignmentId,
        marks,
        percentage,
        level,
        completedAt: new Date()
      });
      studentSubjectLevel.completedAssignments += 1;
      studentSubjectLevel.totalMarksObtained += marks;
      studentSubjectLevel.totalMaxMarks += maxMarks;
      
      console.log(`✅ Added new assignment to performance history`);
    }

    // Recalculate averages based on all completed assignments
    if (studentSubjectLevel.completedAssignments > 0) {
      studentSubjectLevel.averageMarks = studentSubjectLevel.totalMarksObtained / studentSubjectLevel.completedAssignments;
      studentSubjectLevel.averagePercentage = (studentSubjectLevel.totalMarksObtained / studentSubjectLevel.totalMaxMarks) * 100;
    }

    // Update level based on average percentage
    const previousLevel = studentSubjectLevel.level;
    const newLevel = calculateLevel(studentSubjectLevel.averagePercentage);
    
    if (previousLevel !== newLevel) {
      studentSubjectLevel.level = newLevel;
      studentSubjectLevel.levelChanges.push({
        previousLevel,
        newLevel,
        changedAt: new Date(),
        triggerAssignment: assignmentId
      });
      console.log(`🎯 Level changed from ${previousLevel} to ${newLevel}`);
    } else {
      studentSubjectLevel.level = newLevel;
    }

    studentSubjectLevel.lastAssignmentDate = new Date();

    // Save the updated record
    await studentSubjectLevel.save();

    console.log(`✅ Updated StudentSubjectLevel: Avg ${studentSubjectLevel.averagePercentage.toFixed(2)}%, Level: ${studentSubjectLevel.level}`);
    
    return studentSubjectLevel;

  } catch (error) {
    console.error('❌ Error updating student subject level:', error);
    throw error;
  }
}

/**
 * Calculate level based on average percentage
 * @param {Number} averagePercentage - Average percentage
 * @returns {String} Level (beginner/intermediate/advanced)
 */
function calculateLevel(averagePercentage) {
  if (averagePercentage < 35) {
    return 'beginner';
  } else if (averagePercentage >= 35 && averagePercentage <= 70) {
    return 'intermediate';
  } else {
    return 'advanced';
  }
}

/**
 * Get student's subject level information
 * @param {String} studentId - Student's user ID
 * @param {String} subjectId - Subject ID
 */
async function getStudentSubjectLevel(studentId, subjectId) {
  try {
    const studentSubjectLevel = await StudentSubjectLevel.findOne({
      studentId,
      subjectId
    })
    .populate('studentId', 'firstName lastName email studentId')
    .populate('subjectId', 'name code')
    .populate('performanceHistory.assignmentId', 'title dueDate');

    return studentSubjectLevel;
  } catch (error) {
    console.error('❌ Error getting student subject level:', error);
    throw error;
  }
}

/**
 * Get all subject levels for a student
 * @param {String} studentId - Student's user ID
 */
async function getStudentAllSubjectLevels(studentId) {
  try {
    const subjectLevels = await StudentSubjectLevel.find({ studentId })
      .populate('studentId', 'firstName lastName email studentId')
      .populate('subjectId', 'name code')
      .sort({ averagePercentage: -1 });

    return subjectLevels;
  } catch (error) {
    console.error('❌ Error getting student subject levels:', error);
    throw error;
  }
}

/**
 * Get all students' levels for a subject (for lecturer/admin)
 * @param {String} subjectId - Subject ID
 */
async function getSubjectStudentLevels(subjectId) {
  try {
    const studentLevels = await StudentSubjectLevel.find({ subjectId })
      .populate('studentId', 'firstName lastName email studentId')
      .populate('subjectId', 'name code')
      .sort({ averagePercentage: -1 });

    return studentLevels;
  } catch (error) {
    console.error('❌ Error getting subject student levels:', error);
    throw error;
  }
}

module.exports = {
  updateStudentSubjectLevel,
  getStudentSubjectLevel,
  getStudentAllSubjectLevels,
  getSubjectStudentLevels,
  calculateLevel
};
