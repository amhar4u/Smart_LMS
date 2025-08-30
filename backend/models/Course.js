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
  category: {
    type: String,
    enum: ['Technology', 'Business', 'Science', 'Engineering', 'Arts', 'Medicine', 'Other'],
    default: 'Other'
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
courseSchema.index({ isActive: 1 });

// Pre-save middleware to update the updatedAt field
courseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get active courses
courseSchema.statics.getActiveCourses = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Instance method to toggle active status
courseSchema.methods.toggleActive = function() {
  this.isActive = !this.isActive;
  return this.save();
};

module.exports = mongoose.model('Course', courseSchema);
