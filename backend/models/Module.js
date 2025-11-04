const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Module title is required'],
    trim: true,
    maxlength: [100, 'Module title cannot exceed 100 characters']
  },
  name: {
    type: String,
    required: [true, 'Module name is required'],
    trim: true,
    maxlength: [100, 'Module name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Module code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [20, 'Module code cannot exceed 20 characters']
  },
  description: {
    type: String,
    required: [true, 'Module description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
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

// Indexes (code already has unique index from field definition)
moduleSchema.index({ subject: 1, order: 1 });
moduleSchema.index({ isActive: 1 });

// Virtual for subject details
moduleSchema.virtual('subjectDetails', {
  ref: 'Subject',
  localField: 'subject',
  foreignField: '_id',
  justOne: true
});

// Methods
moduleSchema.methods.getPublicInfo = function() {
  return {
    _id: this._id,
    name: this.name,
    code: this.code,
    description: this.description,
    subject: this.subject,
    documents: this.documents,
    video: this.video,
    order: this.order,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Static methods
moduleSchema.statics.findBySubject = function(subjectId) {
  return this.find({ subject: subjectId, isActive: true })
    .sort({ order: 1 })
    .populate('subject', 'name code');
};

moduleSchema.statics.findWithDetails = function(moduleId) {
  return this.findById(moduleId)
    .populate('subject', 'name code description')
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');
};

const Module = mongoose.model('Module', moduleSchema);

module.exports = Module;
