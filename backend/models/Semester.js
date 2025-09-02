const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Semester name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Semester name must be at least 2 characters'],
    maxlength: [50, 'Semester name cannot exceed 50 characters']
  },
  code: {
    type: String,
    required: [true, 'Semester code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [2, 'Semester code must be at least 2 characters'],
    maxlength: [10, 'Semester code cannot exceed 10 characters']
  },
  order: {
    type: Number,
    required: [true, 'Semester order is required'],
    unique: true,
    min: [1, 'Semester order must be at least 1'],
    max: [20, 'Semester order cannot exceed 20']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  duration: {
    type: String,
    enum: ['4 months', '5 months', '6 months', 'Custom'],
    default: '6 months'
  },
  creditRange: {
    min: {
      type: Number,
      default: 12,
      min: [1, 'Minimum credits must be at least 1']
    },
    max: {
      type: Number,
      default: 24,
      min: [1, 'Maximum credits must be at least 1']
    }
  },
  isActive: {
    type: Boolean,
    default: true
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

// Virtual for getting student count in this semester
semesterSchema.virtual('studentCount', {
  ref: 'User',
  localField: 'name',
  foreignField: 'semester',
  count: true,
  match: { role: 'student', isActive: true }
});

// Indexes for performance
semesterSchema.index({ name: 1 });
semesterSchema.index({ code: 1 });
semesterSchema.index({ order: 1 });
semesterSchema.index({ isActive: 1 });
semesterSchema.index({ createdAt: -1 });

// Pre-save middleware to update the updatedAt field
semesterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Pre-save validation to ensure creditRange.max >= creditRange.min
semesterSchema.pre('save', function(next) {
  if (this.creditRange.max < this.creditRange.min) {
    return next(new Error('Maximum credits must be greater than or equal to minimum credits'));
  }
  next();
});

// Method to get active semesters ordered by their sequence
semesterSchema.statics.getActiveSemesters = function() {
  return this.find({ isActive: true }).sort({ order: 1 });
};

// Method to get semester by order
semesterSchema.statics.getSemesterByOrder = function(order) {
  return this.findOne({ order, isActive: true });
};

module.exports = mongoose.model('Semester', semesterSchema);
