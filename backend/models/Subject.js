const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
    minlength: [2, 'Subject name must be at least 2 characters'],
    maxlength: [100, 'Subject name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    uppercase: true,
    trim: true,
    minlength: [2, 'Subject code must be at least 2 characters'],
    maxlength: [10, 'Subject code cannot exceed 10 characters']
  },
  semesterId: {
    type: String,
    required: [true, 'Semester ID is required']
  },
  creditHours: {
    type: Number,
    required: [true, 'Credit hours are required'],
    min: [1, 'Credit hours must be at least 1'],
    max: [10, 'Credit hours cannot exceed 10']
  },
  lecturerId: {
    type: String,
    required: [true, 'Lecturer ID is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better performance
subjectSchema.index({ semesterId: 1 });
subjectSchema.index({ lecturerId: 1 });
subjectSchema.index({ code: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
