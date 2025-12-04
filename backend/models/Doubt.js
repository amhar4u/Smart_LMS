const mongoose = require('mongoose');

const doubtSchema = new mongoose.Schema({
  // Student who asked the doubt
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Lecturer who should answer
  lecturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Subject related to the doubt
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  
  // Optional: Related to specific meeting
  meeting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    default: null
  },
  
  // The question/doubt
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  
  // Lecturer's answer
  answer: {
    type: String,
    default: null,
    trim: true,
    maxlength: 5000
  },
  
  // Status of the doubt
  status: {
    type: String,
    enum: ['pending', 'answered', 'resolved'],
    default: 'pending'
  },
  
  // Visibility: private (only student & lecturer) or public (all students in batch)
  visibility: {
    type: String,
    enum: ['private', 'public'],
    default: 'private'
  },
  
  // For public doubts, track which batch can see it
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    default: null
  },
  
  // Track when answer was provided
  answeredAt: {
    type: Date,
    default: null
  },
  
  // Track when marked as resolved
  resolvedAt: {
    type: Date,
    default: null
  },
  
  // Priority/Urgency
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // Tags for categorization
  tags: [{
    type: String,
    trim: true
  }],
  
  // Attachments/Images (URLs from Cloudinary)
  attachments: [{
    url: String,
    publicId: String,
    type: String // 'image', 'document', etc.
  }],
  
  // Follow-up conversation thread
  replies: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorRole: {
      type: String,
      enum: ['student', 'teacher'],
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Read status
  isReadByLecturer: {
    type: Boolean,
    default: false
  },
  
  isReadByStudent: {
    type: Boolean,
    default: false
  }
  
}, {
  timestamps: true
});

// Indexes for faster queries
doubtSchema.index({ student: 1, status: 1 });
doubtSchema.index({ lecturer: 1, status: 1 });
doubtSchema.index({ subject: 1, status: 1 });
doubtSchema.index({ batch: 1, visibility: 1 });
doubtSchema.index({ createdAt: -1 });

// Virtual for response time (in hours)
doubtSchema.virtual('responseTime').get(function() {
  if (this.answeredAt) {
    return Math.round((this.answeredAt - this.createdAt) / (1000 * 60 * 60));
  }
  return null;
});

// Method to mark as answered
doubtSchema.methods.markAsAnswered = function(answer) {
  this.answer = answer;
  this.status = 'answered';
  this.answeredAt = new Date();
  this.isReadByStudent = false; // Mark as unread for student to see the answer
  return this.save();
};

// Method to mark as resolved
doubtSchema.methods.markAsResolved = function() {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  return this.save();
};

// Static method to get statistics
doubtSchema.statics.getStatistics = async function(filters = {}) {
  const stats = await this.aggregate([
    { $match: filters },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    total: 0,
    pending: 0,
    answered: 0,
    resolved: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  return result;
};

// Static method to get average response time
doubtSchema.statics.getAverageResponseTime = async function(filters = {}) {
  const result = await this.aggregate([
    { 
      $match: { 
        ...filters,
        answeredAt: { $exists: true }
      }
    },
    {
      $project: {
        responseTime: {
          $divide: [
            { $subtract: ['$answeredAt', '$createdAt'] },
            1000 * 60 * 60 // Convert to hours
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgResponseTime: { $avg: '$responseTime' }
      }
    }
  ]);
  
  return result.length > 0 ? Math.round(result[0].avgResponseTime) : 0;
};

const Doubt = mongoose.model('Doubt', doubtSchema);

module.exports = Doubt;
