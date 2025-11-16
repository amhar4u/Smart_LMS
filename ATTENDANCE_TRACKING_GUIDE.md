# 📝 Attendance Tracking - Complete Guide

## 📋 Overview

Real-time attendance monitoring system that tracks student join/leave times during online meetings with support for multiple sessions, late arrival detection, and attendance percentage calculation.

---

## ✅ Features

- **Real-time Tracking**: Automatic join/leave time recording via Socket.IO
- **Multiple Sessions**: Support for students rejoining (tracks all sessions)
- **Late Arrival Detection**: Flags students who join after meeting starts
- **Duration Calculation**: Total time spent in meeting (seconds)
- **Attendance Percentage**: Calculated based on meeting duration
- **Status Classification**: Present (>75%), Partial (50-75%), Absent (<50%)
- **Live Notifications**: Lecturer receives real-time join/leave updates
- **Database Storage**: All attendance data saved to MongoDB

---

## 🚀 Quick Start

### 1. Start Servers

```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
cd frontend
ng serve --host 0.0.0.0 --port 4200
```

### 2. Test Attendance

1. Login as student: `http://192.168.8.168:4200`
2. Join active meeting
3. Check backend console: `👤 Student joined meeting`
4. Stay for few minutes
5. Leave meeting
6. Check backend console: `👋 Student left meeting`
7. Verify database has attendance record

---

## 📊 How It Works

```
Student clicks "Join Meeting"
  ↓
Socket.IO "join-meeting" emitted
  ↓
Backend receives event:
  - Find/Create Attendance record
  - Record join time
  - Check if late (>5 min after start)
  - Save to database
  - Notify lecturer
  ↓
Student in meeting...
  ↓
Student clicks "Leave Meeting"
  ↓
Socket.IO "leave-meeting" emitted
  ↓
Backend receives event:
  - Record leave time
  - Calculate session duration
  - Update total duration
  - Calculate attendance %
  - Update status
  - Save to database
  - Notify lecturer
```

---

## 🗄️ Database Schema

```javascript
{
  meetingId: ObjectId("..."),
  studentId: ObjectId("..."),
  studentName: "John Doe",
  studentEmail: "john@example.com",
  
  // Multiple session support
  sessions: [
    {
      joinTime: ISODate("2025-11-16T10:00:00Z"),
      leaveTime: ISODate("2025-11-16T10:45:00Z"),
      duration: 2700  // 45 minutes in seconds
    },
    {
      joinTime: ISODate("2025-11-16T10:50:00Z"),
      leaveTime: ISODate("2025-11-16T11:00:00Z"),
      duration: 600  // 10 minutes
    }
  ],
  
  firstJoinTime: ISODate("2025-11-16T10:00:00Z"),
  lastLeaveTime: ISODate("2025-11-16T11:00:00Z"),
  totalDuration: 3300,  // 55 minutes total
  attendancePercentage: 91.67,  // 55/60 minutes
  isCurrentlyPresent: false,
  isLate: false,
  status: "present",  // present | partial | absent
  
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

---

## 📡 Socket.IO Events

### From Student:

#### join-meeting
**Emitted:** When student joins meeting

```javascript
socket.emit('join-meeting', {
  meetingId: "673d4f2e...",
  studentId: "68c13317...",
  studentName: "John Doe"
});
```

#### leave-meeting
**Emitted:** When student leaves meeting

```javascript
socket.emit('leave-meeting', {
  meetingId: "673d4f2e...",
  studentId: "68c13317...",
  studentName: "John Doe"
});
```

### To Lecturer:

#### student-joined
**Broadcast:** When student joins

```javascript
socket.on('student-joined', (data) => {
  // data = {
  //   studentId: "...",
  //   studentName: "John Doe",
  //   joinTime: "2025-11-16T10:00:00Z",
  //   sessionCount: 1,
  //   isLate: false,
  //   status: "present"
  // }
});
```

#### student-left
**Broadcast:** When student leaves

```javascript
socket.on('student-left', (data) => {
  // data = {
  //   studentId: "...",
  //   studentName: "John Doe",
  //   leaveTime: "2025-11-16T11:00:00Z",
  //   totalDuration: 3600,
  //   attendancePercentage: 100,
  //   status: "present"
  // }
});
```

---

## 🖥️ Console Output

### Backend - Student Joins:

```
👤 Student John Doe (68c13317...) joined meeting 673d4f2e...
✅ Attendance recorded: John Doe joined at 2025-11-16T10:00:00.000Z
```

### Backend - Student Leaves:

```
👋 Student John Doe left meeting 673d4f2e...
✅ Attendance recorded: John Doe left at 2025-11-16T11:00:00.000Z, duration: 3600s
```

### Frontend (Browser Console):

```javascript
👤 Joined meeting room: 673d4f2e...
// Later...
🧹 Cleaning up emotion tracking...
📷 Webcam stopped
⏹️ Emotion tracking stopped
```

---

## 📊 Attendance Calculation

### Duration:
```javascript
session.duration = leaveTime - joinTime  // in seconds
totalDuration = sum of all session durations
```

### Percentage:
```javascript
meetingDuration = meeting.endedAt - meeting.startedAt
attendancePercentage = (totalDuration / meetingDuration) * 100
```

### Status:
```javascript
if (attendancePercentage >= 75) status = "present"
else if (attendancePercentage >= 50) status = "partial"  
else status = "absent"
```

### Late Arrival:
```javascript
graceMinutes = 5
if (firstJoinTime > meeting.startTime + graceMinutes) {
  isLate = true
}
```

---

## 🔌 API Endpoints

### Join Meeting (Record Attendance)

```http
POST /api/attendance/join
Content-Type: application/json

{
  "meetingId": "673d4f2e...",
  "studentId": "68c13317..."
}
```

### Leave Meeting (Update Attendance)

```http
POST /api/attendance/leave
Content-Type: application/json

{
  "meetingId": "673d4f2e...",
  "studentId": "68c13317..."
}
```

### Get Meeting Attendance

```http
GET /api/attendance/meeting/:meetingId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "meeting": { ... },
    "totalStudents": 25,
    "presentCount": 22,
    "partialCount": 2,
    "absentCount": 1,
    "lateCount": 3,
    "attendances": [...]
  }
}
```

### Get Student Attendance

```http
GET /api/attendance/student/:studentId
```

### Export to CSV

```http
GET /api/attendance/export/meeting/:meetingId/csv
```

---

## 📊 Database Queries

```javascript
// All attendance for meeting
db.attendances.find({ meetingId: ObjectId("...") })

// Currently present students
db.attendances.find({
  meetingId: ObjectId("..."),
  isCurrentlyPresent: true
})

// Late arrivals
db.attendances.find({
  meetingId: ObjectId("..."),
  isLate: true
})

// Low attendance (< 50%)
db.attendances.find({
  meetingId: ObjectId("..."),
  attendancePercentage: { $lt: 50 }
})

// Student attendance history
db.attendances.find({
  studentId: ObjectId("...")
}).sort({ createdAt: -1 })

// Average attendance per student
db.attendances.aggregate([
  { $match: { studentId: ObjectId("...") } },
  { $group: {
      _id: "$studentId",
      avgAttendance: { $avg: "$attendancePercentage" },
      totalMeetings: { $sum: 1 }
  }}
])
```

---

## 🎯 Admin Panel Features

### Meeting Attendance Overview:
- Total students enrolled
- Currently present count
- Late arrivals count
- Attendance statistics (present/partial/absent)

### Student Details:
- First join time
- Last leave time
- Total duration (formatted: 1h 30m 45s)
- Number of sessions (rejoins)
- Attendance percentage
- Status badge (color-coded)
- Late indicator

### Export Options:
- CSV download
- PDF report
- Excel export

---

## 🧪 Testing

### Manual Test:

1. **Start servers**
2. **Student 1:** Login and join meeting
   - Check backend: "Student joined"
   - Check database: Attendance record created
3. **Wait 5 minutes**
4. **Student 1:** Leave meeting
   - Check backend: "Student left, duration: 300s"
   - Check database: Attendance updated
5. **Student 1:** Rejoin meeting
   - Check database: New session added
6. **Verify database:**
   ```javascript
   db.attendances.findOne({ meetingId: ObjectId("...") })
   // Should have 2 sessions, totalDuration updated
   ```

---

## 🐛 Troubleshooting

### Issue: Attendance Not Recorded

**Check:**
- [ ] Backend running?
- [ ] Socket.IO connected (browser console)?
- [ ] MongoDB connected?
- [ ] Student actually in meeting?

**Debug:**
```javascript
// Backend console should show:
👤 Student joined meeting
✅ Attendance recorded

// If not, check:
console.error('Error recording attendance:', error);
```

### Issue: Wrong Duration Calculated

**Verify:**
- Meeting `startedAt` time set correctly
- Student join/leave times accurate
- Time zones consistent (use UTC)

### Issue: Multiple Sessions Not Showing

**Check:**
- `sessions` array in database
- Each rejoin creates new session object
- `totalDuration` is sum of all sessions

---

## 📊 Attendance Reports

### Generate Meeting Report:

```javascript
const AttendanceService = require('./services/attendanceService');

const report = await AttendanceService.generateMeetingReport(meetingId);
// Returns: {
//   meeting,
//   statistics,
//   attendances
// }
```

### Generate Student Report:

```javascript
const report = await AttendanceService.generateStudentReport(
  studentId,
  { startDate, endDate }
);
// Returns attendance history for student
```

### Export to CSV:

```javascript
const csv = await AttendanceService.exportMeetingToCSV(meetingId);
// Returns CSV string
```

---

## 🎯 Late Arrival Policy

**Configuration:**
```javascript
// In Attendance model
attendance.checkLateArrival(meeting.startTime, graceMinutes = 5);
```

**Customization:**
- Modify `graceMinutes` parameter
- Default: 5 minutes
- Can be set per meeting or globally

**Usage:**
```javascript
// After recording join time
attendance.checkLateArrival(meeting.startTime, 10);  // 10-minute grace
```

---

## 🔒 Integration with Emotion Tracking

Both systems work together:

**When student joins meeting:**
1. ✅ Attendance recorded (join time)
2. ✅ Emotion tracking starts

**During meeting:**
1. ✅ Attendance tracks presence
2. ✅ Emotion tracking monitors engagement

**When student leaves:**
1. ✅ Attendance recorded (leave time, duration)
2. ✅ Emotion tracking stops

---

## ✅ Success Checklist

- [ ] Backend running (port 3000)
- [ ] Frontend running (port 4200)
- [ ] MongoDB connected
- [ ] Student can join meeting
- [ ] Backend logs "Student joined"
- [ ] Attendance record created in database
- [ ] Student can leave meeting
- [ ] Backend logs "Student left"
- [ ] Attendance record updated with duration
- [ ] Attendance percentage calculated correctly
- [ ] Lecturer receives real-time notifications

---

## 📈 Attendance Statistics

### Meeting Level:
- Total enrolled students
- Present count (>75%)
- Partial count (50-75%)
- Absent count (<50%)
- Late arrival count
- Average attendance percentage
- Average session duration

### Student Level:
- Total meetings attended
- Average attendance percentage
- Total time in meetings
- Number of late arrivals
- Attendance trend (improving/declining)

---

**Status:** ✅ Fully Implemented | **Updated:** November 16, 2025
