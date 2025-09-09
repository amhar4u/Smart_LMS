const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  meetingId: {
    type: String,
    required: [true, 'Meeting ID is required']
  },
  studentId: {
    type: String,
    required: [true, 'Student ID is required']
  },
  status: {
    type: String,
    required: [true, 'Attendance status is required'],
    enum: ['present', 'absent', 'late', 'excused']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  markedBy: {
    type: String, // Lecturer ID
    required: [true, 'Marked by is required']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  arrivalTime: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for better performance
attendanceSchema.index({ meetingId: 1 });
attendanceSchema.index({ studentId: 1 });
attendanceSchema.index({ timestamp: 1 });

// Compound index for unique attendance per student per meeting
attendanceSchema.index({ meetingId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
