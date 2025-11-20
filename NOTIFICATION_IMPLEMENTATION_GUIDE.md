# Real-Time Notification System Implementation Guide

This guide explains how to integrate the real-time notification system throughout the Smart LMS backend.

## Overview

The notification system uses **Socket.IO** for real-time delivery and **MongoDB** for persistent storage. Notifications are sent when:

- Admin creates/updates subjects, assignments, meetings, modules
- Lecturer creates/updates assignments, meetings, modules  
- Students submit assignments
- Assignments are evaluated
- Results are published
- Attendance is marked
- Accounts are approved/rejected

## Backend Integration Steps

### 1. Import Required Modules

At the top of each route file that needs notifications:

```javascript
const NotificationService = require('../services/notificationService');
```

### 2. Get Socket.IO Instance

In each route handler that needs to send notifications:

```javascript
const io = req.app.get('io');
const notificationService = new NotificationService(io);
```

### 3. Send Notifications

Call the appropriate notification method after successful operations.

---

## Integration by Route File

### A. subjects.js - Subject Assignment

**Location**: After subject creation/update

```javascript
// After successful subject save
const io = req.app.get('io');
const notificationService = new NotificationService(io);

// Get lecturer
const lecturer = await User.findById(subject.lecturerId);

// Get enrolled students
const students = await User.find({
  role: 'student',
  status: 'approved',
  isActive: true,
  batch: subject.batch,
  semester: subject.semester
});

// Send notifications
await notificationService.notifySubjectAssignment(
  subject,
  lecturer,
  students,
  req.user._id
);
```

### B. assignments.js - Assignment Operations

#### B1. Assignment Creation (when isActive=true)

```javascript
// After assignment save and population
if (savedAssignment.isActive) {
  const io = req.app.get('io');
  const notificationService = new NotificationService(io);
  
  // Get subject with lecturer
  const subjectWithLecturer = await Subject.findById(subject)
    .populate('lecturerId');
  
  // Get enrolled students
  const enrolledStudents = await User.find({
    role: 'student',
    status: 'approved',
    isActive: true,
    batch: batch,
    semester: semester
  });

  await notificationService.notifyAssignmentCreated(
    populatedAssignment,
    subjectWithLecturer.lecturerId,
    enrolledStudents,
    req.user._id,
    req.user.role
  );
}
```

#### B2. Assignment Activation

```javascript
// In toggle-status route when activating
if (!wasActive && assignment.isActive) {
  const io = req.app.get('io');
  const notificationService = new NotificationService(io);
  
  // Get populated assignment and students
  const populatedAssignment = await Assignment.findById(assignment._id)
    .populate('subject batch semester');
    
  const subjectWithLecturer = await Subject.findById(assignment.subject)
    .populate('lecturerId');
  
  const enrolledStudents = await User.find({
    role: 'student',
    status: 'approved',
    isActive: true,
    batch: assignment.batch,
    semester: assignment.semester
  });

  await notificationService.notifyAssignmentCreated(
    populatedAssignment,
    subjectWithLecturer.lecturerId,
    enrolledStudents,
    req.user._id,
    req.user.role
  );
}
```

#### B3. Assignment Submission

**File**: `backend/routes/assignmentSubmissions.js` (create if not exists)

```javascript
// After submission save
const io = req.app.get('io');
const notificationService = new NotificationService(io);

// Get assignment and subject
const assignment = await Assignment.findById(submission.assignmentId);
const subject = await Subject.findById(assignment.subject);
const student = await User.findById(submission.studentId);

await notificationService.notifyAssignmentSubmission(
  submission,
  assignment,
  student,
  subject.lecturerId
);
```

#### B4. Assignment Evaluation

```javascript
// In evaluate endpoint after successful evaluation
const io = req.app.get('io');
const notificationService = new NotificationService(io);

const assignment = await Assignment.findById(assignmentId);

await notificationService.notifyAssignmentEvaluated(
  submission,
  assignment,
  submission.studentId,
  req.user._id
);
```

### C. meetings.js - Meeting Scheduling

```javascript
// After meeting save and Daily.co room creation
const io = req.app.get('io');
const notificationService = new NotificationService(io);

// Get subject with lecturer
const subjectWithLecturer = await Subject.findById(subject)
  .populate('lecturerId');

// Get enrolled students
const enrolledStudents = await User.find({
  role: 'student',
  status: 'approved',
  isActive: true,
  batch: batch,
  semester: semester
});

await notificationService.notifyMeetingScheduled(
  savedMeeting,
  subjectWithLecturer.lecturerId,
  enrolledStudents,
  req.user._id,
  req.user.role
);
```

### D. modules.js - Module Upload

```javascript
// After module save
const io = req.app.get('io');
const notificationService = new NotificationService(io);

// Get subject with lecturer
const subjectWithLecturer = await Subject.findById(module.subject)
  .populate('lecturerId');

// Get enrolled students
const enrolledStudents = await User.find({
  role: 'student',
  status: 'approved',
  isActive: true,
  batch: module.batch,
  semester: module.semester
});

await notificationService.notifyModuleCreated(
  module,
  subjectWithLecturer.lecturerId,
  enrolledStudents,
  req.user._id,
  req.user.role,
  false // isExtraModule
);
```

### E. extraModules.js - Extra Module Upload

```javascript
// After extra module save
const io = req.app.get('io');
const notificationService = new NotificationService(io);

// Get subject with lecturer
const subjectWithLecturer = await Subject.findById(extraModule.subject)
  .populate('lecturerId');

// Get enrolled students (filter by level if specified)
let studentQuery = {
  role: 'student',
  status: 'approved',
  isActive: true,
  batch: extraModule.batch,
  semester: extraModule.semester
};

// If level-specific, filter students
if (extraModule.studentLevel) {
  const StudentSubjectLevel = require('../models/StudentSubjectLevel');
  const studentLevels = await StudentSubjectLevel.find({
    subject: extraModule.subject,
    currentLevel: extraModule.studentLevel
  }).select('student');
  
  const studentIds = studentLevels.map(sl => sl.student);
  studentQuery._id = { $in: studentIds };
}

const enrolledStudents = await User.find(studentQuery);

await notificationService.notifyModuleCreated(
  extraModule,
  subjectWithLecturer.lecturerId,
  enrolledStudents,
  req.user._id,
  req.user.role,
  true // isExtraModule
);
```

### F. attendance.js - Attendance Marking

```javascript
// After attendance save
const io = req.app.get('io');
const notificationService = new NotificationService(io);

// Get subject
const subject = await Subject.findById(attendanceRecord.subject);

// Get affected students
const students = await User.find({
  _id: { $in: attendanceRecords.map(a => a.studentId) }
});

await notificationService.notifyAttendanceMarked(
  attendanceRecords,
  students,
  req.user._id,
  subject
);
```

### G. users.js - Account Approval

```javascript
// In approve/reject user endpoint
const io = req.app.get('io');
const notificationService = new NotificationService(io);

await notificationService.notifyAccountApproval(
  userId,
  req.user._id,
  approved, // true or false
  reason // optional rejection reason
);
```

---

## Complete Example: assignments.js Integration

Here's a complete example showing all notification touchpoints in assignments.js:

```javascript
// At the top of the file
const NotificationService = require('../services/notificationService');

// POST /api/assignments - Create assignment
router.post('/', auth, assignmentValidation, async (req, res) => {
  try {
    // ... existing validation code ...
    
    const assignment = new Assignment({
      // ... assignment data ...
    });

    const savedAssignment = await assignment.save();
    const populatedAssignment = await Assignment.findById(savedAssignment._id)
      .populate('department course batch semester subject modules createdBy');

    // Send notifications if active
    if (savedAssignment.isActive) {
      try {
        const io = req.app.get('io');
        const notificationService = new NotificationService(io);
        
        const subjectWithLecturer = await Subject.findById(subject)
          .populate('lecturerId');
        
        const enrolledStudents = await User.find({
          role: 'student',
          status: 'approved',
          isActive: true,
          batch: batch,
          semester: semester
        });

        await notificationService.notifyAssignmentCreated(
          populatedAssignment,
          subjectWithLecturer?.lecturerId,
          enrolledStudents,
          req.user._id,
          req.user.role
        );
        
        console.log(`📧 Notifications sent for assignment: ${savedAssignment.title}`);
      } catch (notifError) {
        console.error('❌ Notification error:', notifError);
        // Don't fail the request
      }
    }

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: populatedAssignment
    });
  } catch (error) {
    // ... error handling ...
  }
});

// POST /api/assignments/:id/toggle-status
router.post('/:id/toggle-status', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    const wasActive = assignment.isActive;
    assignment.isActive = !assignment.isActive;
    await assignment.save();

    // Send notifications when activating
    if (!wasActive && assignment.isActive) {
      try {
        const io = req.app.get('io');
        const notificationService = new NotificationService(io);
        
        const populatedAssignment = await Assignment.findById(assignment._id)
          .populate('department course batch semester subject modules createdBy');
          
        const subjectWithLecturer = await Subject.findById(assignment.subject)
          .populate('lecturerId');
        
        const enrolledStudents = await User.find({
          role: 'student',
          status: 'approved',
          isActive: true,
          batch: assignment.batch,
          semester: assignment.semester
        });

        await notificationService.notifyAssignmentCreated(
          populatedAssignment,
          subjectWithLecturer?.lecturerId,
          enrolledStudents,
          req.user._id,
          req.user.role
        );
        
        console.log(`📧 Activation notifications sent for: ${assignment.title}`);
      } catch (notifError) {
        console.error('❌ Notification error:', notifError);
      }
    }

    res.json({
      success: true,
      message: `Assignment ${assignment.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: assignment.isActive }
    });
  } catch (error) {
    // ... error handling ...
  }
});

// POST /api/assignments/:assignmentId/submissions/:submissionId/evaluate
router.post('/:assignmentId/submissions/:submissionId/evaluate', auth, async (req, res) => {
  try {
    // ... evaluation logic ...
    
    submission.marks = evaluation.marks;
    submission.percentage = evaluation.percentage;
    submission.evaluationStatus = 'completed';
    await submission.save();

    // Send notification to student
    try {
      const io = req.app.get('io');
      const notificationService = new NotificationService(io);
      
      const assignment = await Assignment.findById(req.params.assignmentId);

      await notificationService.notifyAssignmentEvaluated(
        submission,
        assignment,
        submission.studentId,
        req.user._id
      );
      
      console.log(`📧 Evaluation notification sent to student`);
    } catch (notifError) {
      console.error('❌ Notification error:', notifError);
    }

    res.json({
      success: true,
      message: 'Submission evaluated successfully',
      data: submission
    });
  } catch (error) {
    // ... error handling ...
  }
});
```

---

## Testing Notifications

### 1. Check Backend Logs

When notifications are created, you should see:
```
🔔 User 507f1f77bcf86cd799439011 joined notification room
📧 Notifications sent for assignment: Introduction to Programming
```

### 2. Test Socket.IO Connection

Use a tool like Socket.IO client or browser console:
```javascript
const socket = io('http://localhost:3000');
socket.emit('authenticate', 'USER_ID_HERE');
socket.on('notification', (data) => {
  console.log('Received notification:', data);
});
```

### 3. Query Database

Check notifications in MongoDB:
```javascript
db.notifications.find({ recipient: ObjectId("USER_ID") }).sort({ createdAt: -1 })
```

---

## Best Practices

1. **Always wrap notifications in try-catch** - Don't let notification failures break main functionality
2. **Log notification events** - Use console.log for debugging
3. **Populate necessary fields** - Ensure subject, lecturer, students are properly populated
4. **Filter students correctly** - Use batch, semester, status='approved', isActive=true
5. **Use appropriate priority levels**:
   - `urgent`: Account approvals, critical deadlines
   - `high`: Assignments, meetings, evaluations
   - `normal`: Modules, updates
   - `low`: Attendance, minor updates

---

## Notification Types Reference

| Type | Sent To | Triggered By |
|------|---------|--------------|
| `subject_assigned` | Lecturer + Students | Admin creates/updates subject |
| `assignment_created` | Lecturer + Students or Students only | Admin/Lecturer creates assignment |
| `assignment_submission` | Lecturer | Student submits assignment |
| `assignment_evaluated` | Student | Lecturer evaluates submission |
| `meeting_scheduled` | Lecturer + Students or Students only | Admin/Lecturer schedules meeting |
| `module_created` | Lecturer + Students or Students only | Admin/Lecturer uploads module |
| `attendance_marked` | Students | Lecturer marks attendance |
| `account_approved` | User | Admin approves account |
| `account_rejected` | User | Admin rejects account |

---

## Next Steps

1. ✅ Backend notification system is ready
2. ⏳ Integrate into all route files (follow examples above)
3. ⏳ Create frontend notification components
4. ⏳ Connect frontend Socket.IO client
5. ⏳ Test end-to-end notification flow
