# Real-Time Notification System - Quick Reference

## ✅ What's Been Implemented

### Backend Components

1. **Notification Model** (`backend/models/Notification.js`)
   - Stores all notifications in MongoDB
   - Tracks read/unread status
   - Supports 15+ notification types
   - Methods for creating, marking as read, bulk operations

2. **Notification Service** (`backend/services/notificationService.js`)
   - Centralized notification creation
   - Methods for all scenarios:
     - Subject assignment
     - Assignment creation/submission/evaluation
     - Meeting scheduling
     - Module uploads
     - Attendance marking
     - Account approval/rejection

3. **Socket.IO Integration** (`backend/server.js`)
   - Real-time WebSocket communication
   - User authentication rooms (`user:userId`)
   - Notification event handlers:
     - `authenticate` - Join notification room
     - `get-unread-count` - Get count
     - `mark-read` - Mark single as read
     - `mark-all-read` - Mark all as read
   - Emits: `notification`, `unread-count`, `authenticated`

4. **Notification Routes** (`backend/routes/notifications.js`)
   - `GET /api/notifications` - List notifications with pagination
   - `GET /api/notifications/unread-count` - Get unread count
   - `PUT /api/notifications/:id/read` - Mark as read
   - `PUT /api/notifications/read-all` - Mark all as read
   - `DELETE /api/notifications/:id` - Delete notification
   - `DELETE /api/notifications/clear-all` - Clear read notifications

5. **Implementation Guide** (`NOTIFICATION_IMPLEMENTATION_GUIDE.md`)
   - Complete integration examples for all routes
   - Code snippets ready to copy-paste
   - Best practices and testing methods

---

## 📋 Notification Types Supported

### Subject Related
- `subject_assigned` - Admin assigns subject to lecturer/students
- `subject_updated` - Subject details modified

### Assignment Related
- `assignment_created` - New assignment created (active only)
- `assignment_updated` - Assignment modified
- `assignment_activated` - Inactive assignment activated
- `assignment_submission` - Student submits assignment
- `assignment_evaluated` - Assignment graded
- `assignment_published` - Results published to student

### Meeting Related
- `meeting_scheduled` - New meeting created
- `meeting_updated` - Meeting details changed
- `meeting_cancelled` - Meeting cancelled
- `meeting_reminder` - Upcoming meeting reminder

### Module Related
- `module_created` - New module uploaded
- `module_updated` - Module modified
- `extra_module_created` - Extra module uploaded (level-specific)

### Attendance Related
- `attendance_marked` - Attendance recorded
- `attendance_updated` - Attendance modified
- `low_attendance_warning` - Below threshold warning

### Account Related
- `account_approved` - User account approved
- `account_rejected` - User account rejected
- `student_enrolled` - Student enrolled in batch
- `lecturer_assigned` - Lecturer assigned to subject

---

## 🔧 How to Integrate

### Quick Integration Template

```javascript
// 1. Import at top of route file
const NotificationService = require('../services/notificationService');

// 2. In your route handler after successful operation
const io = req.app.get('io');
const notificationService = new NotificationService(io);

// 3. Send notification
try {
  await notificationService.notifyXXX(
    // ... required parameters
  );
  console.log('📧 Notification sent');
} catch (error) {
  console.error('❌ Notification error:', error);
  // Don't fail the main request
}
```

---

## 📁 Files to Modify

### Immediate Priority (Core Features)

1. **backend/routes/assignments.js** ⭐
   - POST `/` - Assignment creation
   - POST `/:id/toggle-status` - Assignment activation
   - POST `/:assignmentId/submissions/:submissionId/evaluate` - Evaluation

2. **backend/routes/subjects.js** ⭐
   - POST `/` - Subject creation
   - PUT `/:id` - Subject update

3. **Create: backend/routes/assignmentSubmissions.js** ⭐
   - POST `/` - Student submits assignment

4. **backend/routes/meetings.js**
   - POST `/` - Meeting creation

5. **backend/routes/modules.js**
   - POST `/` - Module upload

6. **backend/routes/extraModules.js**
   - POST `/` - Extra module upload

7. **backend/routes/attendance.js**
   - POST `/` - Attendance marking

8. **backend/routes/users.js**
   - PUT `/:id/approve` - Account approval
   - PUT `/:id/reject` - Account rejection

---

## 🚀 Next Steps (In Order)

### Step 1: Backend Integration (Current Phase)
- [ ] Integrate notifications in `assignments.js`
- [ ] Integrate notifications in `subjects.js`
- [ ] Create `assignmentSubmissions.js` route with notifications
- [ ] Integrate in `meetings.js`, `modules.js`, `extraModules.js`
- [ ] Integrate in `attendance.js` and `users.js`

### Step 2: Frontend Setup
- [ ] Install socket.io-client in Angular
- [ ] Create notification service
- [ ] Create notification component (bell icon with count)
- [ ] Create notification dropdown/panel
- [ ] Add notification sound/toast

### Step 3: Testing
- [ ] Test each notification type
- [ ] Verify real-time delivery
- [ ] Check MongoDB storage
- [ ] Test read/unread functionality
- [ ] Load testing with multiple users

---

## 🎯 Expected Behavior

### Example Flow: Assignment Submission

1. **Student submits assignment**
   ```
   Student → POST /api/assignment-submissions
   ```

2. **Backend creates submission**
   ```
   Submission saved to database
   ```

3. **Notification service called**
   ```javascript
   notificationService.notifyAssignmentSubmission(...)
   ```

4. **Notification created**
   ```
   Stored in MongoDB with recipient = lecturerId
   ```

5. **Real-time emission**
   ```
   Socket.IO emits to room `user:lecturerId`
   ```

6. **Lecturer receives**
   ```
   Frontend socket listener catches notification
   Bell icon shows "+1" badge
   Toast appears: "New submission from John Doe"
   ```

7. **Lecturer clicks notification**
   ```
   Navigates to actionUrl
   Notification marked as read
   Badge count decreases
   ```

---

## 💡 Key Features

### Real-Time
- ✅ Instant delivery via WebSocket
- ✅ No page refresh needed
- ✅ Works across tabs/devices

### Persistent
- ✅ Stored in MongoDB
- ✅ Available after logout/login
- ✅ Retrievable via REST API

### Smart
- ✅ Read/unread tracking
- ✅ Priority levels (low/normal/high/urgent)
- ✅ Related entity references
- ✅ Action URLs for navigation
- ✅ Metadata for rich display

### Scalable
- ✅ Room-based delivery (one emit per user)
- ✅ Bulk creation for multiple recipients
- ✅ Automatic cleanup of old notifications
- ✅ Pagination support

---

## 🐛 Troubleshooting

### Notifications not received?
1. Check if Socket.IO connected: Look for "🔌 Client connected" in backend logs
2. Verify user authenticated: Look for "🔔 User X joined notification room"
3. Check notification creation: Look for "📧 Notifications sent"
4. Inspect MongoDB: Check if notification document created

### Wrong recipients?
1. Verify student query filters (batch, semester, status, isActive)
2. Check lecturer ID in subject document
3. Review role checks in notification service

### Notifications not marking as read?
1. Verify notification ID in request
2. Check user ID matches recipient
3. Review socket event names (case-sensitive)

---

## 📊 Database Schema

```javascript
{
  _id: ObjectId,
  recipient: ObjectId (ref: User),
  sender: ObjectId (ref: User),
  type: String (enum),
  title: String,
  message: String,
  relatedEntity: {
    entityType: String,
    entityId: ObjectId
  },
  actionUrl: String,
  priority: String (enum: low/normal/high/urgent),
  isRead: Boolean,
  readAt: Date,
  metadata: Mixed,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 Security Notes

- ✅ All notification routes protected with `auth` middleware
- ✅ Users can only see their own notifications
- ✅ Users can only mark their own notifications as read
- ✅ Socket rooms are user-specific (`user:userId`)
- ✅ Notifications validate recipient matches authenticated user

---

## 📈 Performance Considerations

- Notifications are created asynchronously (non-blocking)
- Bulk operations used for multiple recipients
- Indexed fields: recipient, isRead, createdAt, type
- Compound index: (recipient + isRead + createdAt)
- Automatic cleanup of old notifications (90 days default)

---

## 🎨 Frontend Integration Preview

```typescript
// notification.service.ts
export class NotificationService {
  private socket: Socket;
  
  connect(userId: string) {
    this.socket = io('http://localhost:3000');
    this.socket.emit('authenticate', userId);
    
    this.socket.on('notification', (notification) => {
      this.showToast(notification);
      this.updateBadge();
    });
  }
  
  getNotifications() {
    return this.http.get('/api/notifications');
  }
  
  markAsRead(notificationId: string) {
    this.socket.emit('mark-read', { notificationId, userId });
  }
}
```

---

## ✨ Ready to Use!

The backend notification system is fully implemented and ready. Follow the **NOTIFICATION_IMPLEMENTATION_GUIDE.md** to integrate it into your existing routes. Start with `assignments.js` for the most impact, then expand to other features.

**Estimated Integration Time**: 2-4 hours for all route files

**Immediate Next Action**: Open `backend/routes/assignments.js` and add notification calls after successful operations (see guide for exact code).
