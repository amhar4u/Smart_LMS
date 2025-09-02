const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Semester name is required'],
    trim: true,
    minlength: [2, 'Semester name must be at least 2 characters'],
    maxlength: [100, 'Semester name cannot exceed 100 characters']
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
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2020, 'Year must be 2020 or later'],
    max: [2030, 'Year cannot exceed 2030']
  },
  type: {
    type: String,
    required: [true, 'Semester type is required'],
    enum: ['fall', 'spring', 'summer'],
    lowercase: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  registrationStartDate: {
    type: Date
  },
  registrationEndDate: {
    type: Date
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isCurrent: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure only one semester can be current at a time
semesterSchema.pre('save', async function(next) {
  if (this.isCurrent) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isCurrent: false } }
    );
  }
  next();
});

// Validate dates
semesterSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  
  if (this.registrationEndDate && this.registrationStartDate) {
    if (this.registrationEndDate <= this.registrationStartDate) {
      return next(new Error('Registration end date must be after registration start date'));
    }
  }
  
  next();
});

// Indexes for performance
semesterSchema.index({ name: 1 });
semesterSchema.index({ code: 1 });
semesterSchema.index({ year: 1, type: 1 });
semesterSchema.index({ isActive: 1 });
semesterSchema.index({ isCurrent: 1 });
semesterSchema.index({ startDate: 1 });
semesterSchema.index({ endDate: 1 });

// Method to get active semesters ordered by year and type
semesterSchema.statics.getActiveSemesters = function() {
  return this.find({ isActive: true }).sort({ year: -1, type: 1 });
};

// Method to get current semester
semesterSchema.statics.getCurrentSemester = function() {
  return this.findOne({ isCurrent: true, isActive: true });
};

// Method to get semesters by year
semesterSchema.statics.getSemestersByYear = function(year) {
  return this.find({ year, isActive: true }).sort({ type: 1 });
};

module.exports = mongoose.model('Semester', semesterSchema);
