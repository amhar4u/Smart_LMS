const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Meeting title is required'],
    trim: true,
    minlength: [2, 'Meeting title must be at least 2 characters'],
    maxlength: [200, 'Meeting title cannot exceed 200 characters']
  },
  moduleId: {
    type: String,
    required: [true, 'Module ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Meeting date is required']
  },
  startTime: {
    type: String, // Format: "HH:MM"
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String, // Format: "HH:MM"
    required: [true, 'End time is required']
  },
  mode: {
    type: String,
    required: [true, 'Meeting mode is required'],
    enum: ['online', 'offline', 'hybrid']
  },
  meetingLink: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (this.mode === 'online' || this.mode === 'hybrid') {
          return v && v.length > 0;
        }
        return true;
      },
      message: 'Meeting link is required for online/hybrid meetings'
    }
  },
  location: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (this.mode === 'offline' || this.mode === 'hybrid') {
          return v && v.length > 0;
        }
        return true;
      },
      message: 'Location is required for offline/hybrid meetings'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better performance
meetingSchema.index({ moduleId: 1 });
meetingSchema.index({ date: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
