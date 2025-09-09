const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema({
  assignmentId: {
    type: String,
    required: [true, 'Assignment ID is required']
  },
  studentId: {
    type: String,
    required: [true, 'Student ID is required']
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  textSubmission: {
    type: String,
    trim: true,
    maxlength: [10000, 'Text submission cannot exceed 10000 characters']
  },
  fileUrl: {
    type: String,
    trim: true
  },
  fileName: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number,
    min: [0, 'File size cannot be negative']
  },
  marksObtained: {
    type: Number,
    min: [0, 'Marks obtained cannot be negative'],
    default: null
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  },
  gradedAt: {
    type: Date,
    default: null
  },
  gradedBy: {
    type: String, // Lecturer ID
    default: null
  },
  isLateSubmission: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'returned'],
    default: 'submitted'
  }
}, {
  timestamps: true
});

// Index for better performance
assignmentSubmissionSchema.index({ assignmentId: 1 });
assignmentSubmissionSchema.index({ studentId: 1 });
assignmentSubmissionSchema.index({ submittedAt: 1 });

// Compound index for unique submission per student per assignment
assignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
