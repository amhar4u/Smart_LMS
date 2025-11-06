const mongoose = require('mongoose');

const extraModuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Extra module title is required'],
    trim: true,
    maxlength: [100, 'Extra module title cannot exceed 100 characters']
  },
  name: {
    type: String,
    required: [true, 'Extra module name is required'],
    trim: true,
    maxlength: [100, 'Extra module name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Extra module code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [20, 'Extra module code cannot exceed 20 characters']
  },
  description: {
    type: String,
    required: [true, 'Extra module description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  studentLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'All'],
    default: 'All',
    required: [true, 'Student level is required']
  },
  documents: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    uniqueName: {
      type: String,
      required: true,
      trim: true
    },
    cloudinaryURL: {
      type: String,
      required: true // Cloudinary secure URL
    },
    publicId: {
      type: String,
      required: true // Cloudinary public ID for deletion
    },
    resourceType: {
      type: String,
      enum: ['image', 'video', 'raw'],
      default: 'raw' // raw for PDFs and documents
    },
    fileType: {
      type: String,
      required: true
    },
    size: {
      type: Number, // Size in bytes
      required: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  video: {
    name: {
      type: String,
      trim: true
    },
    uniqueName: {
      type: String,
      trim: true
    },
    cloudinaryURL: {
      type: String // Cloudinary secure URL
    },
    publicId: {
      type: String // Cloudinary public ID for deletion
    },
    resourceType: {
      type: String,
      enum: ['image', 'video', 'raw'],
      default: 'video'
    },
    fileType: {
      type: String
    },
    size: {
      type: Number
    },
    duration: {
      type: Number // Duration in seconds
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  order: {
    type: Number,
    default: 0,
    min: 0
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
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
extraModuleSchema.index({ subject: 1, order: 1 });
extraModuleSchema.index({ isActive: 1 });
extraModuleSchema.index({ studentLevel: 1 });
extraModuleSchema.index({ subject: 1, studentLevel: 1 });

// Virtual for subject details
extraModuleSchema.virtual('subjectDetails', {
  ref: 'Subject',
  localField: 'subject',
  foreignField: '_id',
  justOne: true
});

// Methods
extraModuleSchema.methods.getPublicInfo = function() {
  return {
    _id: this._id,
    name: this.name,
    code: this.code,
    description: this.description,
    subject: this.subject,
    studentLevel: this.studentLevel,
    documents: this.documents,
    video: this.video,
    order: this.order,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Static methods
extraModuleSchema.statics.findBySubject = function(subjectId) {
  return this.find({ subject: subjectId, isActive: true })
    .sort({ order: 1 })
    .populate('subject', 'name code');
};

extraModuleSchema.statics.findByStudentLevel = function(level) {
  return this.find({ 
    studentLevel: { $in: [level, 'All'] }, 
    isActive: true 
  })
    .sort({ order: 1 })
    .populate('subject', 'name code');
};

extraModuleSchema.statics.findWithDetails = function(moduleId) {
  return this.findById(moduleId)
    .populate('subject', 'name code description')
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');
};

const ExtraModule = mongoose.model('ExtraModule', extraModuleSchema);

module.exports = ExtraModule;
