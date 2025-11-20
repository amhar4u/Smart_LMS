const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      // Subject related
      'subject_assigned',
      'subject_updated',
      
      // Assignment related
      'assignment_created',
      'assignment_updated',
      'assignment_activated',
      'assignment_submission',
      'assignment_evaluated',
      'assignment_published',
      
      // Meeting related
      'meeting_scheduled',
      'meeting_updated',
      'meeting_cancelled',
      'meeting_reminder',
      
      // Module related
      'module_created',
      'module_updated',
      'extra_module_created',
      
      // Attendance related
      'attendance_marked',
      'attendance_updated',
      'low_attendance_warning',
      
      // User account related
      'account_approved',
      'account_rejected',
      'student_enrolled',
      'lecturer_assigned',
      
      // General
      'announcement',
      'system_notification'
    ]
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  // Reference to related entity
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['Assignment', 'Meeting', 'Module', 'ExtraModule', 'Subject', 'Attendance', 'AssignmentSubmission', 'Batch', 'Semester']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  // Action URL for navigation
  actionUrl: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });

// Static method to create and emit notification
notificationSchema.statics.createNotification = async function(notificationData, io) {
  const notification = await this.create(notificationData);
  const populatedNotification = await this.findById(notification._id)
    .populate('sender', 'firstName lastName email role')
    .populate('recipient', 'firstName lastName email role');
  
  // Emit real-time notification if socket.io instance is provided
  if (io) {
    io.to(`user:${notificationData.recipient}`).emit('notification', populatedNotification);
  }
  
  return populatedNotification;
};

// Static method to mark as read
notificationSchema.statics.markAsRead = async function(notificationId, userId) {
  return this.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

// Static method to mark all as read for a user
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

// Static method to delete old notifications (cleanup)
notificationSchema.statics.deleteOldNotifications = async function(daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true
  });
};

module.exports = mongoose.model('Notification', notificationSchema);
