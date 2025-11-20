const Notification = require('../models/Notification');

/**
 * Notification Service
 * Handles creation and management of real-time notifications
 */
class NotificationService {
  constructor(io) {
    this.io = io;
  }

  /**
   * Create and send a notification
   */
  async createNotification({
    recipientId,
    senderId,
    type,
    title,
    message,
    relatedEntity,
    actionUrl,
    priority = 'normal',
    metadata = {}
  }) {
    try {
      const notification = await Notification.createNotification({
        recipient: recipientId,
        sender: senderId,
        type,
        title,
        message,
        relatedEntity,
        actionUrl,
        priority,
        metadata
      }, this.io);

      return notification;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send notifications to multiple recipients
   */
  async createBulkNotifications(recipients, notificationData) {
    try {
      const notifications = [];
      
      for (const recipientId of recipients) {
        const notification = await this.createNotification({
          ...notificationData,
          recipientId
        });
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('❌ Error creating bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Subject assignment notifications
   */
  async notifySubjectAssignment(senderId, lecturerId, studentIds, subjectId, subjectName, subjectCode) {
    // Notify lecturer
    await this.createNotification({
      recipientId: lecturerId,
      senderId: senderId,
      type: 'subject_assigned',
      title: 'New Subject Assigned',
      message: `You have been assigned to teach ${subjectName} (${subjectCode})`,
      relatedEntity: {
        entityType: 'Subject',
        entityId: subjectId
      },
      actionUrl: `/lecturer/subjects/${subjectId}`,
      priority: 'high',
      metadata: {
        subjectName: subjectName,
        subjectCode: subjectCode
      }
    });

    // Notify students
    await this.createBulkNotifications(studentIds, {
      senderId: senderId,
      type: 'subject_assigned',
      title: 'New Subject Enrolled',
      message: `You have been enrolled in ${subjectName} (${subjectCode})`,
      relatedEntity: {
        entityType: 'Subject',
        entityId: subjectId
      },
      actionUrl: `/student/subjects/${subjectId}`,
      priority: 'normal',
      metadata: {
        subjectName: subjectName,
        subjectCode: subjectCode
      }
    });
  }

  /**
   * Assignment creation notifications
   */
  async notifyAssignmentCreated(assignment, lecturer, students, creatorId, creatorRole) {
    const recipients = [];
    
    // If admin created, notify lecturer
    if (creatorRole === 'admin' && lecturer) {
      await this.createNotification({
        recipientId: lecturer._id,
        senderId: creatorId,
        type: 'assignment_created',
        title: 'New Assignment Created',
        message: `Admin created assignment: ${assignment.title}`,
        relatedEntity: {
          entityType: 'Assignment',
          entityId: assignment._id
        },
        actionUrl: `/lecturer/assignments/${assignment._id}`,
        priority: 'high',
        metadata: {
          dueDate: assignment.dueDate,
          maxMarks: assignment.maxMarks
        }
      });
    }

    // Notify students
    const studentIds = students.map(s => s._id);
    await this.createBulkNotifications(studentIds, {
      senderId: creatorId,
      type: 'assignment_created',
      title: 'New Assignment Available',
      message: `New assignment: ${assignment.title}. Due: ${new Date(assignment.dueDate).toLocaleDateString()}`,
      relatedEntity: {
        entityType: 'Assignment',
        entityId: assignment._id
      },
      actionUrl: `/student/assignments/${assignment._id}`,
      priority: 'high',
      metadata: {
        dueDate: assignment.dueDate,
        maxMarks: assignment.maxMarks
      }
    });
  }

  /**
   * Assignment submission notification
   */
  async notifyAssignmentSubmission(submission, assignment, student, lecturerId) {
    await this.createNotification({
      recipientId: lecturerId,
      senderId: student._id,
      type: 'assignment_submission',
      title: 'New Assignment Submission',
      message: `${student.firstName} ${student.lastName} submitted ${assignment.title}`,
      relatedEntity: {
        entityType: 'AssignmentSubmission',
        entityId: submission._id
      },
      actionUrl: `/lecturer/assignments/${assignment._id}/submissions/${submission._id}`,
      priority: 'normal',
      metadata: {
        studentName: `${student.firstName} ${student.lastName}`,
        submittedAt: submission.submittedAt
      }
    });
  }

  /**
   * Assignment evaluation notification
   */
  async notifyAssignmentEvaluated(submission, assignment, studentId, lecturerId) {
    await this.createNotification({
      recipientId: studentId,
      senderId: lecturerId,
      type: 'assignment_evaluated',
      title: 'Assignment Evaluated',
      message: `Your assignment "${assignment.title}" has been evaluated. Marks: ${submission.marks}/${assignment.maxMarks}`,
      relatedEntity: {
        entityType: 'AssignmentSubmission',
        entityId: submission._id
      },
      actionUrl: `/student/assignments/${assignment._id}/result`,
      priority: 'high',
      metadata: {
        marks: submission.marks,
        maxMarks: assignment.maxMarks,
        percentage: submission.percentage,
        level: submission.level
      }
    });
  }

  /**
   * Meeting scheduled notifications
   */
  async notifyMeetingScheduled(senderId, recipientIds, meetingId, meetingTopic, subjectName, subjectId, meetingDate, startTime) {
    // Create notifications for all recipients (lecturer + students or just students)
    if (recipientIds && recipientIds.length > 0) {
      const meetingDateTime = new Date(`${meetingDate}T${startTime}`);
      const formattedDateTime = meetingDateTime.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });

      await this.createBulkNotifications(recipientIds, {
        senderId: senderId,
        type: 'meeting_scheduled',
        title: 'New Meeting Scheduled',
        message: `Meeting "${meetingTopic}" for ${subjectName} scheduled on ${formattedDateTime}`,
        relatedEntity: {
          entityType: 'Meeting',
          entityId: meetingId
        },
        actionUrl: `/meetings/${meetingId}`,
        priority: 'high',
        metadata: {
          meetingTopic: meetingTopic,
          subjectName: subjectName,
          subjectId: subjectId,
          meetingDate: meetingDate,
          startTime: startTime
        }
      });
    }
  }

  /**
   * Module created notifications
   */
  async notifyModuleCreated(senderId, recipientIds, moduleId, moduleName, subjectName, subjectId, isExtraModule = false) {
    const moduleType = isExtraModule ? 'Extra Module' : 'Module';
    
    // Create notifications for all recipients (can be lecturer + students or just students)
    if (recipientIds && recipientIds.length > 0) {
      await this.createBulkNotifications(recipientIds, {
        senderId: senderId,
        type: isExtraModule ? 'extra_module_created' : 'module_created',
        title: `New ${moduleType} Available`,
        message: `New ${moduleType} "${moduleName}" has been added to ${subjectName}`,
        relatedEntity: {
          entityType: isExtraModule ? 'ExtraModule' : 'Module',
          entityId: moduleId
        },
        actionUrl: `/modules/${moduleId}`,
        priority: 'normal',
        metadata: {
          moduleName: moduleName,
          subjectName: subjectName,
          subjectId: subjectId
        }
      });
    }
  }

  /**
   * Attendance marked notification
   */
  async notifyAttendanceMarked(attendance, students, lecturerId, subject) {
    for (const student of students) {
      const attendanceRecord = attendance.find(a => a.studentId.toString() === student._id.toString());
      
      if (attendanceRecord) {
        await this.createNotification({
          recipientId: student._id,
          senderId: lecturerId,
          type: 'attendance_marked',
          title: 'Attendance Marked',
          message: `Your attendance for ${subject.name} has been marked as ${attendanceRecord.status}`,
          relatedEntity: {
            entityType: 'Attendance',
            entityId: attendanceRecord._id
          },
          actionUrl: `/student/attendance`,
          priority: 'low',
          metadata: {
            status: attendanceRecord.status,
            date: attendanceRecord.date,
            subjectName: subject.name
          }
        });
      }
    }
  }

  /**
   * Account approval notification
   */
  async notifyAccountApproval(userId, adminId, approved, reason = '') {
    await this.createNotification({
      recipientId: userId,
      senderId: adminId,
      type: approved ? 'account_approved' : 'account_rejected',
      title: approved ? 'Account Approved' : 'Account Rejected',
      message: approved 
        ? 'Your account has been approved. You can now login to the system.'
        : `Your account has been rejected. ${reason}`,
      actionUrl: '/auth/login',
      priority: 'urgent'
    });
  }

  /**
   * Low attendance warning
   */
  async notifyLowAttendance(studentId, lecturerId, attendancePercentage, subject) {
    await this.createNotification({
      recipientId: studentId,
      senderId: lecturerId,
      type: 'low_attendance_warning',
      title: 'Low Attendance Warning',
      message: `Your attendance in ${subject.name} is ${attendancePercentage}%. Please improve your attendance.`,
      relatedEntity: {
        entityType: 'Subject',
        entityId: subject._id
      },
      actionUrl: `/student/attendance`,
      priority: 'urgent',
      metadata: {
        attendancePercentage,
        subjectName: subject.name
      }
    });
  }
}

module.exports = NotificationService;
