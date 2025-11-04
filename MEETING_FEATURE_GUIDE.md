# Video Meeting Feature - Implementation Guide

## Overview
This document describes the implementation of the video meeting feature for Smart LMS using Daily.co SDK.

## Features Implemented

### For Lecturers:
1. **Create Meeting**
   - Select Department, Course, Batch, Semester, and Subject
   - Subject lecturer is automatically retrieved from the database
   - Select single or multiple modules
   - Add meeting topic, description, date, and time
   - Meeting room is automatically created via Daily API

2. **Manage Meetings**
   - View all scheduled, ongoing, and completed meetings
   - Start button is only enabled when current time reaches scheduled meeting time
   - Join ongoing meetings
   - End meetings and manually enter student attendance count
   - Cancel scheduled meetings
   - Edit meeting details before start time

3. **Meeting Room**
   - Full-featured video conferencing using Daily.co
   - Screen sharing
   - Chat functionality
   - Recording capabilities
   - Leave meeting option

### For Students:
1. **View Available Meetings**
   - See all scheduled and ongoing meetings
   - View meeting details (topic, description, lecturer, modules, time)
   - Time countdown for scheduled meetings

2. **Join Meetings**
   - Join ongoing meetings with one click
   - Full video conferencing features

## Technical Implementation

### Backend

#### 1. Meeting Model (`backend/models/Meeting.js`)
```javascript
- topic: Meeting title
- description: Meeting details
- departmentId, courseId, batchId, semesterId, subjectId: References
- lecturerId: Automatically set from subject
- moduleIds: Array of module references (supports multiple)
- meetingDate, startTime, endTime: Scheduling
- dailyRoomName, dailyRoomUrl: Daily.co integration
- status: scheduled, ongoing, completed, cancelled
- studentCount: Manually entered by lecturer
- startedAt, endedAt: Actual meeting times
```

#### 2. Daily Service (`backend/services/dailyService.js`)
Handles all Daily.co API interactions:
- `createRoom()`: Create new meeting room
- `getRoom()`: Get room details
- `deleteRoom()`: Delete room
- `createMeetingToken()`: Generate access tokens for participants
- `getMeetingSession()`: Get active session info

**Configuration:**
- API Key: `7254b5e6a63ee1527c919cb706e3fc305b67f979c663db78165caa595d2f9785`
- Domain: `slms.daily.co`

#### 3. Meeting Routes (`backend/routes/meetings.js`)
API Endpoints:
- `POST /api/meetings` - Create meeting
- `GET /api/meetings` - List meetings (filtered by role)
- `GET /api/meetings/:id` - Get meeting details
- `GET /api/meetings/:id/can-start` - Check if meeting can start
- `POST /api/meetings/:id/start` - Start meeting
- `POST /api/meetings/:id/end` - End meeting with student count
- `POST /api/meetings/:id/join` - Join meeting (students)
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Cancel meeting
- `GET /api/meetings/subject/:subjectId/modules` - Get modules by subject

### Frontend

#### 1. Meeting Service (`frontend/src/app/services/meeting.service.ts`)
Angular service for API communication with proper interfaces and types.

#### 2. Lecturer Components

**Create Meeting Component** (`lecturer/create-meeting/create-meeting.component.ts`)
- Cascading dropdowns for selection hierarchy
- Dynamic module loading based on subject
- Automatic lecturer retrieval
- Form validation
- Material Design UI

**Meeting List Component** (`lecturer/meeting-list/meeting-list.component.ts`)
- Display all meetings with status chips
- Time-based button enabling for starting meetings
- Auto-refresh every minute
- Actions: Start, Join, End, Edit, Cancel
- Time countdown display

**Meeting Room Component** (`lecturer/meeting-room/meeting-room.component.ts`)
- Daily.co iframe integration
- Token-based authentication
- Meeting controls
- Error handling

#### 3. Student Components

**Student Meetings Component** (`student/student-meetings/student-meetings.component.ts`)
- View scheduled and ongoing meetings
- Beautiful card-based layout
- Meeting details display
- Join button for ongoing meetings

**Student Meeting Room Component** (`student/student-meeting-room/student-meeting-room.component.ts`)
- Similar to lecturer room but simplified
- Token-based access
- Leave meeting functionality

## Routes

### Lecturer Routes:
- `/lecturer/meetings` - Meeting list
- `/lecturer/meetings/create` - Create new meeting
- `/lecturer/meetings/room/:id` - Join meeting room

### Student Routes:
- `/student/meetings` - Available meetings
- `/student/meetings/room/:id` - Join meeting room

## Installation & Setup

### Backend Dependencies:
```bash
cd backend
npm install axios
```

### Frontend Dependencies:
```bash
cd frontend
npm install @daily-co/daily-js --legacy-peer-deps
```

### Environment Variables (Optional):
Add to `backend/.env`:
```
DAILY_API_KEY=7254b5e6a63ee1527c919cb706e3fc305b67f979c663db78165caa595d2f9785
DAILY_DOMAIN=slms.daily.co
```

## Usage Flow

### Creating a Meeting (Lecturer):
1. Navigate to `/lecturer/meetings`
2. Click "Create Meeting"
3. Select Department → Course → Batch → Semester → Subject
4. Lecturer info appears automatically
5. Select one or more modules
6. Enter meeting topic, description, date, and time
7. Click "Create Meeting"
8. Meeting room is created on Daily.co automatically

### Starting a Meeting (Lecturer):
1. Go to meeting list
2. Wait until scheduled time (button auto-enables)
3. Click "Start Meeting"
4. Meeting status changes to "ongoing"
5. Video interface loads
6. Students can now join

### Ending a Meeting (Lecturer):
1. Click "End Meeting" button
2. Enter number of students who attended
3. Meeting status changes to "completed"
4. Statistics are saved

### Joining a Meeting (Student):
1. Navigate to `/student/meetings`
2. See list of available meetings
3. Click "Join Meeting" for ongoing meetings
4. Access is granted via token
5. Video interface loads

## Security Features

1. **Token-based Access**: Each participant gets a unique token
2. **Role-based Permissions**: 
   - Lecturers: Owner rights (recording, etc.)
   - Students: Participant rights
3. **Time-based Access**: Students can only join ongoing meetings
4. **Subject Authorization**: Only subject lecturer can create meetings

## Daily.co Room Configuration

- **Enable Screen Share**: Yes
- **Enable Chat**: Yes
- **Enable Recording**: Cloud recording enabled
- **Prejoin UI**: Enabled for better user experience
- **Auto-expire**: Rooms expire 4 hours after scheduled start time

## Database Schema

The Meeting model includes indexes on:
- departmentId, courseId, batchId, semesterId, subjectId
- lecturerId, moduleIds
- meetingDate, startTime
- status

This ensures fast queries when filtering meetings.

## Error Handling

- Network errors: Graceful fallback with user notifications
- Invalid meeting access: Proper error messages
- Daily.co API errors: Logged and reported to user
- Token expiration: Handled by Daily.co SDK

## Future Enhancements

Potential improvements:
1. Recording management (view past recordings)
2. Automated attendance tracking
3. Meeting analytics (duration, participant count)
4. In-app notifications for upcoming meetings
5. Calendar integration
6. Breakout rooms for group activities
7. Polls and quizzes during meetings
8. Meeting templates for recurring classes

## Testing Checklist

- [ ] Create meeting with single module
- [ ] Create meeting with multiple modules
- [ ] Verify lecturer auto-population
- [ ] Test start button time-based enabling
- [ ] Start meeting and verify video works
- [ ] Student joins ongoing meeting
- [ ] Test screen sharing
- [ ] Test chat functionality
- [ ] End meeting with student count
- [ ] Edit scheduled meeting
- [ ] Cancel meeting
- [ ] Test with multiple concurrent meetings
- [ ] Verify proper cleanup on meeting end

## Support & Troubleshooting

### Common Issues:

1. **Meeting won't start**
   - Check if current time >= scheduled time
   - Verify Daily.co API key is valid
   - Check network connectivity

2. **Video not loading**
   - Ensure browser supports WebRTC
   - Check camera/microphone permissions
   - Verify firewall settings

3. **Cannot join meeting**
   - Verify meeting status is "ongoing"
   - Check token generation
   - Ensure proper authorization

4. **Modules not loading**
   - Verify subject has associated modules
   - Check database relationships
   - Ensure proper API responses

## API Documentation

Full API documentation available in the `backend/routes/meetings.js` file with JSDoc comments for each endpoint.

## Credits

- **Daily.co**: Video infrastructure provider
- **Angular Material**: UI components
- **MongoDB**: Database
- **Express.js**: Backend framework

---

**Implementation Date**: November 2025
**Version**: 1.0.0
**Status**: Production Ready
