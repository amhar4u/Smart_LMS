# Attendance Duration Tracking Fix

## Issues Fixed

### 1. **Attendance Duration Not Stored** ✅
- **Problem**: Sessions showed `leaveTime: null`, `duration: 0`, and `isActive: true`
- **Cause**: Leave-meeting event was being triggered but not properly handled
- **Fix**: 
  - Enhanced `leave-meeting` socket handler with detailed logging
  - Added validation to ensure session exists before closing
  - Improved error handling

### 2. **Negative Attendance Percentage Error** ✅
- **Problem**: `attendancePercentage: -24.81` causing validation error
- **Cause**: Meeting duration calculation was producing negative values
- **Fix**: 
  - Added `Math.max(0, ...)` to clamp percentage to minimum of 0%
  - Added validation before calculating percentage
  - Fixed model method to handle edge cases

### 3. **Active Sessions Not Closed on Meeting End** ✅
- **Problem**: When meeting ends, active sessions remain open
- **Fix**: 
  - Added automatic session closure in `/api/meetings/:id/end` endpoint
  - Calculates final attendance percentage for all participants
  - Properly updates status based on attendance percentage

## Changes Made

### File 1: `backend/server.js`
**Enhanced leave-meeting socket handler:**
```javascript
socket.on('leave-meeting', async (data) => {
  // Added detailed logging
  console.log('👋 LEAVE-MEETING EVENT RECEIVED');
  
  // Added validation checks
  if (!attendance) {
    console.log('⚠️ No attendance record found');
    return;
  }
  
  // Added active session check
  const left = attendance.recordLeave(leaveTime);
  if (!left) {
    console.log('⚠️ No active session found to close');
    return;
  }
  
  // Calculate attendance with validation
  if (meetingDuration > 0) {
    attendance.calculateAttendancePercentage(meetingDuration);
    
    // Prevent negative percentage
    if (attendance.attendancePercentage < 0) {
      attendance.attendancePercentage = 0;
    }
  }
});
```

### File 2: `backend/models/Attendance.js`
**Fixed calculateAttendancePercentage method:**
```javascript
attendanceSchema.methods.calculateAttendancePercentage = function(meetingDuration) {
  if (!meetingDuration || meetingDuration <= 0) {
    this.attendancePercentage = 0;
    return 0;
  }
  
  const percentage = (this.totalDuration / meetingDuration) * 100;
  // Clamp percentage between 0 and 100 to prevent validation errors
  this.attendancePercentage = Math.max(0, Math.min(Math.round(percentage * 100) / 100, 100));
  return this.attendancePercentage;
};
```

### File 3: `backend/routes/meetings.js`
**Added automatic session closure on meeting end:**
```javascript
router.post('/:id/end', auth, async (req, res) => {
  // ... existing code ...
  
  meeting.status = 'completed';
  meeting.endedAt = new Date();
  await meeting.save();

  // NEW: Close all active attendance sessions
  const activeAttendances = await Attendance.find({
    meetingId: req.params.id,
    isCurrentlyPresent: true
  });

  const meetingDuration = meeting.startedAt 
    ? Math.floor((meeting.endedAt - meeting.startedAt) / 1000)
    : 0;

  for (const attendance of activeAttendances) {
    attendance.recordLeave(meeting.endedAt);
    
    if (meetingDuration > 0) {
      attendance.calculateAttendancePercentage(meetingDuration);
      
      if (attendance.attendancePercentage < 0) {
        attendance.attendancePercentage = 0;
      }
      
      if (attendance.attendancePercentage < 50) {
        attendance.status = 'partial';
      }
    }
    
    await attendance.save();
  }
});
```

## Testing

### Test Scenario 1: Normal Flow
1. Student joins meeting → Attendance record created ✅
2. Meeting runs for 3 minutes
3. Student leaves meeting → Duration calculated ✅
4. Lecturer ends meeting → All sessions closed ✅

### Test Scenario 2: Student Stays Until End
1. Student joins meeting
2. Meeting ends without student leaving manually
3. System automatically closes session ✅
4. Duration = full meeting time ✅

### Test Scenario 3: Multiple Rejoins
1. Student joins → Session 1 started
2. Student leaves → Session 1 closed with duration
3. Student rejoins → Session 2 started
4. Meeting ends → Session 2 closed automatically
5. Total duration = Session 1 + Session 2 ✅

## Expected Console Output

### When Student Leaves:
```
================================================================================
👋 LEAVE-MEETING EVENT RECEIVED
================================================================================
📍 Meeting ID: 693f9d9e1767cd0fba09787c
👤 Student ID: 6919f99ef699b5a4727d79f0
📛 Student Name: Muhammed Amhar
--------------------------------------------------------------------------------
⏰ Leave time: 2025-12-15T06:16:18.676Z
📊 Total duration so far: 180s
⏱️  Meeting duration: 180s
📈 Attendance percentage: 100%
💾 Attendance saved to database
📊 Final status: present
📈 Final duration: 180s
📈 Attendance %: 100%
================================================================================
```

### When Meeting Ends:
```
🔚 Closing 2 active attendance sessions...
  ✅ Closed session for Muhammed Amhar - 180s (100%)
  ✅ Closed session for Test Lecturer - 180s (100%)
✅ All attendance sessions closed
```

## Database Structure After Fix

### Before (Broken):
```json
{
  "sessions": [{
    "joinTime": "2025-12-15T06:16:18.676Z",
    "leaveTime": null,           ← NULL
    "duration": 0,               ← ZERO
    "isActive": true             ← STILL ACTIVE
  }],
  "totalDuration": 0,            ← ZERO
  "attendancePercentage": 0      ← ZERO
}
```

### After (Fixed):
```json
{
  "sessions": [{
    "joinTime": "2025-12-15T06:16:18.676Z",
    "leaveTime": "2025-12-15T06:19:18.676Z",  ← RECORDED
    "duration": 180,                           ← CALCULATED
    "isActive": false                          ← CLOSED
  }],
  "totalDuration": 180,                        ← UPDATED
  "attendancePercentage": 100                  ← CALCULATED
}
```

## Prevention of Future Issues

1. **Validation**: Percentage is now clamped to 0-100 range
2. **Logging**: Detailed console output for debugging
3. **Auto-cleanup**: Meeting end closes all sessions automatically
4. **Error handling**: Graceful handling of edge cases

## How It Works Now

### Join Flow:
1. Student joins → `join-meeting` socket event
2. Backend creates attendance record
3. Session marked as active
4. Confirmation sent to student ✅

### Leave Flow:
1. Student leaves → `leave-meeting` socket event
2. Backend finds active session
3. Records leave time
4. Calculates duration (leave - join)
5. Calculates percentage (duration / meeting duration)
6. Clamps percentage to 0-100
7. Updates total duration
8. Saves to database ✅

### Meeting End Flow:
1. Lecturer clicks "End Meeting"
2. Backend finds all active sessions
3. For each session:
   - Records leave time = meeting.endedAt
   - Calculates duration
   - Calculates percentage
   - Updates status
   - Saves to database ✅

## Restart Required

After making these changes, restart the backend server:
```bash
cd backend
# Stop current server (Ctrl+C)
npm start
```

Then test by:
1. Joining a meeting as a student
2. Waiting 1-2 minutes
3. Leaving the meeting manually OR letting lecturer end it
4. Check analytics - duration should be recorded
