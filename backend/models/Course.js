const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
    unique: true,
    minlength: [2, 'Course name must be at least 2 characters'],
    maxlength: [100, 'Course name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    trim: true,
    unique: true,
    uppercase: true,
    minlength: [2, 'Course code must be at least 2 characters'],
    maxlength: [10, 'Course code cannot exceed 10 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required for course']
  },
  duration: {
    type: String,
    enum: ['1 year', '2 years', '3 years', '4 years', '5 years', 'semester', '1 semester', '2 semesters', '6 months', '1 month', '3 months'],
    required: [true, 'Duration is required'],
    default: '4 years'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
courseSchema.index({ category: 1 });
courseSchema.index({ department: 1 });
courseSchema.index({ isActive: 1 });
courseSchema.index({ department: 1, isActive: 1 });

// Pre-save middleware to update the updatedAt field
courseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get active courses
courseSchema.statics.getActiveCourses = function() {
  return this.find({ isActive: true }).populate('department').sort({ name: 1 });
};

// Static method to get courses by department
courseSchema.statics.getCoursesByDepartment = function(departmentId) {
  return this.find({ 
    department: departmentId, 
    isActive: true 
  }).populate('department').sort({ name: 1 });
};

// Instance method to toggle active status
courseSchema.methods.toggleActive = function() {
  this.isActive = !this.isActive;
  return this.save();
};

module.exports = mongoose.model('Course', courseSchema);
