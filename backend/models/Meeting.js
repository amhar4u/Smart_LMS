const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: [true, 'Meeting topic is required'],
    trim: true,
    minlength: [2, 'Meeting topic must be at least 2 characters'],
    maxlength: [200, 'Meeting topic cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Meeting description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  // Department, Course, Batch, Semester, Subject References
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch is required']
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: [true, 'Semester is required']
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  lecturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Lecturer is required']
  },
  // Support for multiple modules
  moduleIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  }],
  // Meeting date and time
  meetingDate: {
    type: Date,
    required: [true, 'Meeting date is required']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: false
  },
  // Daily API Integration
  dailyRoomName: {
    type: String,
    required: true,
    unique: true
  },
  dailyRoomUrl: {
    type: String,
    required: true
  },
  dailyRoomConfig: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Meeting status
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  // Student count (manually entered by lecturer after meeting)
  studentCount: {
    type: Number,
    default: 0,
    min: [0, 'Student count cannot be negative']
  },
  // Meeting logs
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  },
  // Emotion Tracking
  emotionTrackingEnabled: {
    type: Boolean,
    default: true,
    comment: 'Enable/disable emotion tracking for this meeting'
  },
  emotionSummary: {
    avgHappiness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    avgEngagement: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    alertsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    participantsTracked: {
      type: Number,
      default: 0,
      min: 0
    },
    lastUpdated: {
      type: Date
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
meetingSchema.index({ departmentId: 1 });
meetingSchema.index({ courseId: 1 });
meetingSchema.index({ batchId: 1 });
meetingSchema.index({ semesterId: 1 });
meetingSchema.index({ subjectId: 1 });
meetingSchema.index({ lecturerId: 1 });
meetingSchema.index({ moduleIds: 1 });
meetingSchema.index({ meetingDate: 1 });
meetingSchema.index({ startTime: 1 });
meetingSchema.index({ status: 1 });

// Method to check if meeting can start (allows starting 5 minutes before scheduled time)
meetingSchema.methods.canStartNow = function() {
  const now = new Date();
  const meetingStart = new Date(this.startTime);
  const fiveMinutesBeforeStart = new Date(meetingStart.getTime() - (5 * 60 * 1000)); // 5 minutes before
  
  return now >= fiveMinutesBeforeStart && this.status === 'scheduled';
};

// Method to get meeting details with populated references
meetingSchema.statics.getMeetingWithDetails = function(meetingId) {
  return this.findById(meetingId)
    .populate('departmentId', 'name code')
    .populate('courseId', 'name code')
    .populate('batchId', 'name year maxStudents')
    .populate('semesterId', 'name number')
    .populate('subjectId', 'name code')
    .populate('lecturerId', 'firstName lastName email')
    .populate('moduleIds', 'name code title');
};

module.exports = mongoose.model('Meeting', meetingSchema);
