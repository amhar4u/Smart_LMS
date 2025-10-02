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
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department ID is required']
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch ID is required']
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: [true, 'Semester ID is required']
  },
  creditHours: {
    type: Number,
    required: [true, 'Credit hours are required'],
    min: [1, 'Credit hours must be at least 1'],
    max: [10, 'Credit hours cannot exceed 10']
  },
  lecturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
subjectSchema.index({ departmentId: 1 });
subjectSchema.index({ courseId: 1 });
subjectSchema.index({ batchId: 1 });
subjectSchema.index({ semesterId: 1 });
subjectSchema.index({ lecturerId: 1 });
subjectSchema.index({ code: 1 });

// Static method to get subjects by department
subjectSchema.statics.getSubjectsByDepartment = function(departmentId) {
  return this.find({ 
    departmentId: departmentId, 
    isActive: true 
  }).populate(['departmentId', 'courseId', 'semesterId', 'lecturerId']).sort({ name: 1 });
};

// Static method to get subjects by course
subjectSchema.statics.getSubjectsByCourse = function(courseId) {
  return this.find({ 
    courseId: courseId, 
    isActive: true 
  }).populate(['departmentId', 'courseId', 'semesterId', 'lecturerId']).sort({ name: 1 });
};

module.exports = mongoose.model('Subject', subjectSchema);
