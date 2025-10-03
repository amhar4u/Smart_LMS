const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['MCQ', 'short_answer', 'essay'],
    required: true
  },
  options: [{
    option: String,
    isCorrect: Boolean
  }], // For MCQ questions
  correctAnswer: String, // For short answer questions
  maxWords: Number, // For essay questions
  marks: {
    type: Number,
    default: 1
  }
});

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    minlength: [2, 'Assignment title must be at least 2 characters'],
    maxlength: [200, 'Assignment title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Assignment description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch is required']
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: [true, 'Semester is required']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  modules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  }],
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  assignmentLevel: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: [true, 'Assignment level is required']
  },
  assignmentType: {
    type: String,
    enum: ['MCQ', 'short_answer', 'essay'],
    required: [true, 'Assignment type is required']
  },
  numberOfQuestions: {
    type: Number,
    required: [true, 'Number of questions is required'],
    min: [1, 'At least 1 question is required'],
    max: [100, 'Maximum 100 questions allowed']
  },
  questions: [questionSchema],
  maxMarks: {
    type: Number,
    required: [true, 'Maximum marks are required'],
    min: [1, 'Maximum marks must be at least 1'],
    max: [1000, 'Maximum marks cannot exceed 1000']
  },
  instructions: {
    type: String,
    trim: true,
    maxlength: [3000, 'Instructions cannot exceed 3000 characters']
  },
  attachments: [{
    name: String,
    url: String,
    size: Number
  }],
  submissionType: {
    type: String,
    enum: ['online', 'file', 'both'],
    default: 'online'
  },
  allowLateSubmission: {
    type: Boolean,
    default: false
  },
  lateSubmissionPenalty: {
    type: Number,
    min: [0, 'Penalty cannot be negative'],
    max: [100, 'Penalty cannot exceed 100%'],
    default: 0
  },
  timeLimit: {
    type: Number, // in minutes
    min: [1, 'Time limit must be at least 1 minute']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedFromContent: {
    type: String // Store the content used for AI generation
  }
}, {
  timestamps: true
});

// Index for better performance
assignmentSchema.index({ department: 1 });
assignmentSchema.index({ course: 1 });
assignmentSchema.index({ batch: 1 });
assignmentSchema.index({ semester: 1 });
assignmentSchema.index({ subject: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ assignmentLevel: 1 });
assignmentSchema.index({ assignmentType: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
