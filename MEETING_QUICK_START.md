# Video Meeting Feature - Quick Start Guide

## What's Implemented

✅ **Backend (Node.js/Express)**
- Meeting model with support for multiple modules
- Daily.co API integration service
- Complete REST API for meetings
- Token-based video access
- Role-based permissions

✅ **Frontend (Angular)**
- Create meeting form with cascading dropdowns
- Meeting list for lecturers
- Meeting list for students
- Video room interface for both roles
- Real-time status updates

## Quick Start

### 1. Start Backend
```bash
cd backend
npm install axios  # If not already installed
npm start
```

### 2. Start Frontend
```bash
cd frontend
npm install @daily-co/daily-js --legacy-peer-deps  # If not already installed
npm start
```

### 3. Access the Application

**As Lecturer:**
1. Login at `/auth/login`
2. Go to `/lecturer/meetings`
3. Click "Create Meeting"
4. Fill the form (Department → Course → Batch → Semester → Subject → Modules)
5. Set meeting date/time
6. Create meeting
7. When time comes, click "Start Meeting"

**As Student:**
1. Login at `/auth/login`
2. Go to `/student/meetings`
3. See available meetings
4. Click "Join Meeting" for ongoing meetings

## Key Features

### Meeting Creation Flow
```
Department → Course → Batch → Semester → Subject
                                            ↓
                                    Lecturer (Auto)
                                            ↓
                                    Modules (Select 1+)
                                            ↓
                              Topic + Description + Time
                                            ↓
                                    Daily Room Created
```

### Meeting Lifecycle
```
SCHEDULED → (Time Reached) → ONGOING → (Lecturer Ends) → COMPLETED
                                ↓
                        (Can Cancel) CANCELLED
```

### Start Meeting Button Logic
- Disabled until current time >= scheduled time
- Auto-checks every minute
- Only visible to meeting lecturer/creator

### Student Attendance
- Manually entered by lecturer when ending meeting
- Stored in `studentCount` field
- Can be used for analytics

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/meetings` | Create meeting |
| GET | `/api/meetings` | List meetings |
| GET | `/api/meetings/:id` | Get meeting details |
| GET | `/api/meetings/:id/can-start` | Check if can start |
| POST | `/api/meetings/:id/start` | Start meeting |
| POST | `/api/meetings/:id/end` | End meeting |
| POST | `/api/meetings/:id/join` | Join meeting (student) |
| PUT | `/api/meetings/:id` | Update meeting |
| DELETE | `/api/meetings/:id` | Cancel meeting |

## Daily.co Configuration

**Already Configured:**
- API Key: `7254b5e6a63ee1527c919cb706e3fc305b67f979c663db78165caa595d2f9785`
- Domain: `slms.daily.co`

**Room Features:**
- Screen sharing ✓
- Chat ✓
- Recording (cloud) ✓
- Prejoin UI ✓
- 4-hour expiration

## Files Created/Modified

### Backend
- ✅ `models/Meeting.js` - Updated model
- ✅ `services/dailyService.js` - New service
- ✅ `routes/meetings.js` - New routes
- ✅ `server.js` - Added route

### Frontend
- ✅ `services/meeting.service.ts` - New service
- ✅ `component/lecturer/create-meeting/` - New component
- ✅ `component/lecturer/meeting-list/` - New component
- ✅ `component/lecturer/meeting-room/` - New component
- ✅ `component/student/student-meetings/` - New component
- ✅ `component/student/student-meeting-room/` - New component
- ✅ `app.routes.ts` - Added routes

## Testing Steps

1. **Create Meeting**
   - Login as lecturer
   - Navigate to meetings page
   - Create a meeting for near-future time
   - Verify it appears in list with "scheduled" status

2. **Start Meeting**
   - Wait for scheduled time (or set time close)
   - Click "Start Meeting"
   - Verify video interface loads
   - Check status changed to "ongoing"

3. **Student Join**
   - Login as student (different browser/incognito)
   - Go to meetings page
   - See the ongoing meeting
   - Click "Join Meeting"
   - Verify can see/hear lecturer

4. **End Meeting**
   - As lecturer, click "End Meeting"
   - Enter student count
   - Verify status changed to "completed"

## Troubleshooting

**Issue: "Start Meeting" button disabled**
- Check system time is >= scheduled time
- Refresh page to update status

**Issue: Video not loading**
- Allow camera/microphone permissions
- Check browser console for errors
- Verify Daily.co API key is active

**Issue: Cannot join meeting**
- Ensure meeting status is "ongoing"
- Check user authentication
- Verify token generation

**Issue: Modules not loading**
- Ensure subject has modules in database
- Check subject selection is valid
- Verify API response in network tab

## Navigation Menu Integration

To add meeting links to your navigation menus:

**Lecturer Menu:**
```html
<a routerLink="/lecturer/meetings">
  <mat-icon>videocam</mat-icon>
  <span>Meetings</span>
</a>
```

**Student Menu:**
```html
<a routerLink="/student/meetings">
  <mat-icon>event</mat-icon>
  <span>Meetings</span>
</a>
```

## Next Steps

1. Add navigation menu items for easy access
2. Test with real users
3. Monitor Daily.co usage/billing
4. Consider adding:
   - Email notifications for upcoming meetings
   - Meeting recordings management
   - Attendance reports
   - Calendar integration

## Support

For detailed documentation, see `MEETING_FEATURE_GUIDE.md`

For Daily.co API issues, check: https://docs.daily.co/

---

**Status**: ✅ Ready for Production
**Last Updated**: November 2025
