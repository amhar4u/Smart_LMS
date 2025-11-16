const mongoose = require('mongoose');

// Session schema to track individual join/leave sessions
const sessionSchema = new mongoose.Schema({
  joinTime: {
    type: Date,
    required: true
  },
  leaveTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // Duration in seconds
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: true });

const attendanceSchema = new mongoose.Schema({
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: [true, 'Meeting ID is required']
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  studentName: {
    type: String,
    required: true
  },
  studentEmail: {
    type: String,
    required: true
  },
  // Track all join/leave sessions (supports rejoins)
  sessions: [sessionSchema],
  // Overall attendance status
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'partial'],
    default: 'absent'
  },
  // First join time
  firstJoinTime: {
    type: Date,
    default: null
  },
  // Last leave time
  lastLeaveTime: {
    type: Date,
    default: null
  },
  // Total duration in seconds
  totalDuration: {
    type: Number,
    default: 0
  },
  // Number of times rejoined
  rejoinCount: {
    type: Number,
    default: 0
  },
  // Whether student is currently in the meeting
  isCurrentlyPresent: {
    type: Boolean,
    default: false
  },
  // Attendance percentage (based on meeting duration)
  attendancePercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Notes (optional, can be added by lecturer)
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  // Late arrival (if joined after scheduled start time + grace period)
  isLate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
attendanceSchema.index({ meetingId: 1 });
attendanceSchema.index({ studentId: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ createdAt: 1 });
attendanceSchema.index({ meetingId: 1, studentId: 1 }, { unique: true });

// Method to add a join session
attendanceSchema.methods.recordJoin = function(joinTime = new Date()) {
  // If currently present, don't create duplicate session
  if (this.isCurrentlyPresent) {
    return false;
  }

  const session = {
    joinTime: joinTime,
    leaveTime: null,
    duration: 0,
    isActive: true
  };

  this.sessions.push(session);
  this.isCurrentlyPresent = true;

  // Set first join time if not set
  if (!this.firstJoinTime) {
    this.firstJoinTime = joinTime;
  }

  // Update status
  if (this.status === 'absent') {
    this.status = 'present';
  }

  // Increment rejoin count (exclude first join)
  if (this.sessions.length > 1) {
    this.rejoinCount++;
  }

  return true;
};

// Method to record leave
attendanceSchema.methods.recordLeave = function(leaveTime = new Date()) {
  // Find the active session
  const activeSession = this.sessions.find(s => s.isActive);
  
  if (!activeSession) {
    return false;
  }

  activeSession.leaveTime = leaveTime;
  activeSession.isActive = false;
  
  // Calculate duration for this session (in seconds)
  const duration = Math.floor((leaveTime - activeSession.joinTime) / 1000);
  activeSession.duration = duration;

  // Update total duration
  this.totalDuration += duration;
  this.lastLeaveTime = leaveTime;
  this.isCurrentlyPresent = false;

  return true;
};

// Method to calculate attendance percentage based on meeting duration
attendanceSchema.methods.calculateAttendancePercentage = function(meetingDuration) {
  if (!meetingDuration || meetingDuration === 0) {
    return 0;
  }
  
  const percentage = (this.totalDuration / meetingDuration) * 100;
  this.attendancePercentage = Math.min(Math.round(percentage * 100) / 100, 100);
  return this.attendancePercentage;
};

// Method to check if student was late (joined after scheduled start + grace period)
attendanceSchema.methods.checkLateArrival = function(scheduledStartTime, gracePeriodMinutes = 5) {
  if (!this.firstJoinTime) {
    return false;
  }

  const gracePeriodMs = gracePeriodMinutes * 60 * 1000;
  const lateThreshold = new Date(scheduledStartTime.getTime() + gracePeriodMs);
  
  this.isLate = this.firstJoinTime > lateThreshold;
  
  if (this.isLate && this.status === 'present') {
    this.status = 'late';
  }
  
  return this.isLate;
};

// Static method to get attendance for a meeting
attendanceSchema.statics.getMeetingAttendance = function(meetingId) {
  return this.find({ meetingId })
    .populate('studentId', 'firstName lastName email rollNumber')
    .sort({ firstJoinTime: 1 });
};

// Static method to get student's attendance history
attendanceSchema.statics.getStudentAttendance = function(studentId, filters = {}) {
  const query = { studentId };
  
  if (filters.startDate && filters.endDate) {
    query.createdAt = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }
  
  return this.find(query)
    .populate('meetingId', 'topic meetingDate startTime endTime')
    .sort({ createdAt: -1 });
};

// Static method to get attendance statistics for a student
attendanceSchema.statics.getStudentStatistics = async function(studentId) {
  const attendances = await this.find({ studentId });
  
  const totalMeetings = attendances.length;
  const presentCount = attendances.filter(a => a.status === 'present').length;
  const lateCount = attendances.filter(a => a.status === 'late').length;
  const partialCount = attendances.filter(a => a.status === 'partial').length;
  const absentCount = attendances.filter(a => a.status === 'absent').length;
  
  const averageAttendancePercentage = totalMeetings > 0
    ? attendances.reduce((sum, a) => sum + a.attendancePercentage, 0) / totalMeetings
    : 0;
  
  return {
    totalMeetings,
    presentCount,
    lateCount,
    partialCount,
    absentCount,
    averageAttendancePercentage: Math.round(averageAttendancePercentage * 100) / 100,
    overallAttendanceRate: totalMeetings > 0 
      ? Math.round(((presentCount + lateCount) / totalMeetings) * 100 * 100) / 100
      : 0
  };
};

module.exports = mongoose.model('Attendance', attendanceSchema);
