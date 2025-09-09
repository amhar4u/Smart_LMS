const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Batch name is required'],
    trim: true,
    minlength: [2, 'Batch name must be at least 2 characters'],
    maxlength: [100, 'Batch name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Batch code is required'],
    trim: true,
    unique: true,
    uppercase: true,
    minlength: [2, 'Batch code must be at least 2 characters'],
    maxlength: [10, 'Batch code cannot exceed 10 characters']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required for batch']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required for batch']
  },
  startYear: {
    type: Number,
    required: [true, 'Start year is required'],
    min: [2020, 'Start year must be 2020 or later'],
    max: [2030, 'Start year cannot exceed 2030']
  },
  endYear: {
    type: Number,
    required: [true, 'End year is required'],
    min: [2020, 'End year must be 2020 or later'],
    max: [2035, 'End year cannot exceed 2035']
  },
  // Semesters that belong to this batch
  semesters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester'
  }],
  // Current active semester for this batch
  currentSemester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester'
  },
  maxStudents: {
    type: Number,
    min: [1, 'Maximum students must be at least 1'],
    max: [500, 'Maximum students cannot exceed 500'],
    default: 60
  },
  currentEnrollment: {
    type: Number,
    default: 0,
    min: [0, 'Current enrollment cannot be negative']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active'
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

// Virtual for enrollment percentage
batchSchema.virtual('enrollmentPercentage').get(function() {
  if (this.maxStudents === 0) return 0;
  return Math.round((this.currentEnrollment / this.maxStudents) * 100);
});

// Virtual for remaining slots
batchSchema.virtual('remainingSlots').get(function() {
  return Math.max(0, this.maxStudents - this.currentEnrollment);
});

// Indexes for performance
batchSchema.index({ course: 1 });
batchSchema.index({ department: 1 });
batchSchema.index({ startYear: 1 });
batchSchema.index({ status: 1 });
batchSchema.index({ isActive: 1 });
batchSchema.index({ course: 1, startYear: 1 });
batchSchema.index({ department: 1, isActive: 1 });

// Pre-save middleware to validate end year
batchSchema.pre('save', function(next) {
  if (this.endYear <= this.startYear) {
    return next(new Error('End year must be greater than start year'));
  }
  this.updatedAt = new Date();
  next();
});

// Static method to get active batches
batchSchema.statics.getActiveBatches = function() {
  return this.find({ isActive: true, status: 'active' })
    .populate('course department currentSemester')
    .sort({ startYear: -1, name: 1 });
};

// Static method to get batches by course
batchSchema.statics.getBatchesByCourse = function(courseId) {
  return this.find({ 
    course: courseId, 
    isActive: true,
    status: 'active'
  }).populate('course department currentSemester semesters')
    .sort({ startYear: -1 });
};

// Static method to get batches by department
batchSchema.statics.getBatchesByDepartment = function(departmentId) {
  return this.find({ 
    department: departmentId, 
    isActive: true 
  }).populate('course department currentSemester')
    .sort({ startYear: -1, name: 1 });
};

// Instance method to add semester to batch
batchSchema.methods.addSemester = function(semesterId) {
  if (!this.semesters.includes(semesterId)) {
    this.semesters.push(semesterId);
  }
  return this.save();
};

// Instance method to set current semester
batchSchema.methods.setCurrentSemester = function(semesterId) {
  // Ensure the semester is in the batch's semesters array
  if (!this.semesters.includes(semesterId)) {
    this.semesters.push(semesterId);
  }
  this.currentSemester = semesterId;
  return this.save();
};

// Instance method to increment enrollment
batchSchema.methods.incrementEnrollment = function() {
  if (this.currentEnrollment < this.maxStudents) {
    this.currentEnrollment += 1;
    return this.save();
  } else {
    throw new Error('Batch is at maximum capacity');
  }
};

// Instance method to decrement enrollment
batchSchema.methods.decrementEnrollment = function() {
  if (this.currentEnrollment > 0) {
    this.currentEnrollment -= 1;
    return this.save();
  }
  return this.save();
};

// Instance method to check if batch has available slots
batchSchema.methods.hasAvailableSlots = function() {
  return this.currentEnrollment < this.maxStudents;
};

module.exports = mongoose.model('Batch', batchSchema);
