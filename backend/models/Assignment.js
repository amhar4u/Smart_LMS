const mongoose = require('mongoose');

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
  moduleId: {
    type: String,
    required: [true, 'Module ID is required']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
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
    enum: ['file', 'text', 'both'],
    default: 'file'
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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better performance
assignmentSchema.index({ moduleId: 1 });
assignmentSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
