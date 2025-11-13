const mongoose = require('mongoose');

const studentSubjectLevelSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject ID is required']
  },
  averageMarks: {
    type: Number,
    min: [0, 'Average marks cannot be negative'],
    max: [100, 'Average marks cannot exceed 100'],
    default: 0
  },
  averagePercentage: {
    type: Number,
    min: [0, 'Average percentage cannot be negative'],
    max: [100, 'Average percentage cannot exceed 100'],
    default: 0
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  totalAssignments: {
    type: Number,
    min: [0, 'Total assignments cannot be negative'],
    default: 0
  },
  completedAssignments: {
    type: Number,
    min: [0, 'Completed assignments cannot be negative'],
    default: 0
  },
  totalMarksObtained: {
    type: Number,
    min: [0, 'Total marks obtained cannot be negative'],
    default: 0
  },
  totalMaxMarks: {
    type: Number,
    min: [0, 'Total max marks cannot be negative'],
    default: 0
  },
  lastAssignmentDate: {
    type: Date,
    default: null
  },
  performanceHistory: [{
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment'
    },
    marks: Number,
    percentage: Number,
    level: String,
    completedAt: Date
  }],
  levelChanges: [{
    previousLevel: String,
    newLevel: String,
    changedAt: {
      type: Date,
      default: Date.now
    },
    triggerAssignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment'
    }
  }]
}, {
  timestamps: true
});

// Index for better performance
studentSubjectLevelSchema.index({ studentId: 1 });
studentSubjectLevelSchema.index({ subjectId: 1 });
studentSubjectLevelSchema.index({ level: 1 });
studentSubjectLevelSchema.index({ studentId: 1, subjectId: 1 }, { unique: true });

// Method to calculate and update level based on average percentage
studentSubjectLevelSchema.methods.calculateLevel = function() {
  if (this.averagePercentage < 35) {
    return 'beginner';
  } else if (this.averagePercentage >= 35 && this.averagePercentage <= 70) {
    return 'intermediate';
  } else {
    return 'advanced';
  }
};

// Method to update performance after new submission
studentSubjectLevelSchema.methods.updatePerformance = function(assignmentData) {
  const { assignmentId, marks, maxMarks, percentage, level, completedAt } = assignmentData;
  
  // Update totals
  this.totalMarksObtained += marks;
  this.totalMaxMarks += maxMarks;
  this.completedAssignments += 1;
  
  // Calculate new average
  this.averagePercentage = (this.totalMarksObtained / this.totalMaxMarks) * 100;
  this.averageMarks = this.totalMarksObtained / this.completedAssignments;
  
  // Calculate new level
  const previousLevel = this.level;
  this.level = this.calculateLevel();
  
  // Track level change
  if (previousLevel !== this.level) {
    this.levelChanges.push({
      previousLevel,
      newLevel: this.level,
      changedAt: new Date(),
      triggerAssignment: assignmentId
    });
  }
  
  // Add to performance history
  this.performanceHistory.push({
    assignmentId,
    marks,
    percentage,
    level,
    completedAt
  });
  
  this.lastAssignmentDate = completedAt || new Date();
  
  return this;
};

module.exports = mongoose.model('StudentSubjectLevel', studentSubjectLevelSchema);
