const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Department name must be at least 2 characters'],
    maxlength: [100, 'Department name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [2, 'Department code must be at least 2 characters'],
    maxlength: [10, 'Department code cannot exceed 10 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  establishedYear: {
    type: Number,
    min: [1900, 'Established year must be after 1900'],
    max: [new Date().getFullYear(), 'Established year cannot be in the future']
  },
  faculty: {
    type: String,
    trim: true,
    maxlength: [100, 'Faculty name cannot exceed 100 characters']
  },
  contactInfo: {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address'
      ]
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
    },
    office: {
      type: String,
      trim: true,
      maxlength: [100, 'Office location cannot exceed 100 characters']
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

// Virtual for getting teacher count
departmentSchema.virtual('teacherCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department',
  count: true,
  match: { role: 'teacher', isActive: true }
});

// Virtual for getting student count
departmentSchema.virtual('studentCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department',
  count: true,
  match: { role: 'student', isActive: true }
});

// Virtual for getting course count
departmentSchema.virtual('courseCount', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'department',
  count: true,
  match: { isActive: true }
});

// Indexes for performance
departmentSchema.index({ name: 1 });
departmentSchema.index({ code: 1 });
departmentSchema.index({ isActive: 1 });
departmentSchema.index({ createdAt: -1 });

// Pre-save middleware to update the updatedAt field
departmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to get active departments
departmentSchema.statics.getActiveDepartments = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

module.exports = mongoose.model('Department', departmentSchema);
