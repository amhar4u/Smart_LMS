const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  questionText: String, // Store the question text
  type: String, // Store question type (MCQ, short_answer, essay)
  answer: String, // Student's answer
  selectedOption: String, // For MCQ
  isCorrect: Boolean, // Auto-evaluated for MCQ
  marksAwarded: Number,
  questionDetails: { // Store complete question details for evaluation
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { _id: false });

const assignmentSubmissionSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: [true, 'Assignment ID is required']
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  startedAt: {
    type: Date,
    default: Date.now  // Add default to prevent null/undefined issues
  },
  submittedAt: {
    type: Date,
    default: null  // Explicitly null until actual submission
  },
  timeTaken: {
    type: Number, // in seconds
    default: 0  // Default to 0 instead of required
  },
  submittedAnswers: [answerSchema], // Array of answers
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
  marks: {
    type: Number,
    min: [0, 'Marks cannot be negative'],
    default: null
  },
  percentage: {
    type: Number,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100'],
    default: null
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: null
  },
  evaluationResponse: {
    type: String, // Full AI evaluation response
    trim: true
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: [5000, 'Feedback cannot exceed 5000 characters']
  },
  gradedAt: {
    type: Date,
    default: null
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isLateSubmission: {
    type: Boolean,
    default: false
  },
  isAutoEvaluated: {
    type: Boolean,
    default: false
  },
  evaluationStatus: {
    type: String,
    enum: ['pending', 'evaluating', 'completed', 'failed'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'returned'],
    default: 'submitted'
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better performance
assignmentSubmissionSchema.index({ assignmentId: 1 });
assignmentSubmissionSchema.index({ studentId: 1 });
assignmentSubmissionSchema.index({ submittedAt: 1 });
assignmentSubmissionSchema.index({ evaluationStatus: 1 });
assignmentSubmissionSchema.index({ level: 1 });
assignmentSubmissionSchema.index({ studentId: 1, assignmentId: 1 });

// Note: Removed unique compound index to allow resubmission after deletion
// Instead, we handle uniqueness in the application logic
// assignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

// Non-unique compound index for better query performance
assignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 });

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
