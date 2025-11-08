# Lecturer Meeting Management Feature

## Overview
The Lecturer Meeting Management feature provides lecturers with full control over creating, editing, deleting, and managing video meetings for their subjects. This feature mirrors the admin meeting management capabilities but is restricted to the lecturer's own subjects.

## Implementation Date
November 8, 2025

## Features Implemented

### 1. Complete Meeting Management Interface
- **Create Meetings**: Full meeting creation dialog with all fields
- **Edit Meetings**: Update existing scheduled meetings
- **Delete Meetings**: Remove meetings with confirmation dialog
- **Reschedule**: Change meeting date/time for scheduled meetings
- **Host Meetings**: Start meetings with host privileges
- **Filter & Search**: Filter meetings by subject and status

### 2. Meeting Creation Dialog Integration
- Reuses admin's `MeetingDialogComponent`
- Automatic filtering to lecturer's subjects only
- Auto-population of department, course, batch, semester from subject
- Module selection from subject's modules
- Date/time picker with validation
- Duration configuration (1-480 minutes)
- Auto-calculated end time

### 3. Meeting Status Management
- **Scheduled**: Upcoming meetings (can edit/delete/reschedule)
- **Ongoing**: Currently active meetings
- **Completed**: Finished meetings with attendance data
- **Cancelled**: Deleted meetings

### 4. Host Privileges
- Host meeting 15 minutes before scheduled time
- Automatic status update to "ongoing" when started
- Daily.co video room integration
- Host-specific URL parameters

### 5. Real-time Updates
- Auto-refresh every 60 seconds
- Live status updates
- Subscription-based refresh mechanism

## File Structure

```
frontend/src/app/component/lecturer/meeting-list/
└── meeting-list.component.ts   (Updated - 350+ lines)
```

## Key Components

### TypeScript Component (`meeting-list.component.ts`)

**Key Properties:**
- `meetings`: Array of Meeting objects
- `lecturerSubjects`: Subjects taught by the lecturer
- `filters`: Subject and status filters
- `currentUser`: Authenticated lecturer information
- `displayedColumns`: Table column configuration
- `refreshSubscription`: Auto-refresh subscription

**Key Methods:**
- `loadLecturerSubjects()`: Fetch subjects taught by the lecturer
- `loadMeetings()`: Load meetings filtered by lecturer ID
- `openCreateMeetingDialog()`: Open meeting creation dialog
- `editMeeting(meeting)`: Edit existing meeting
- `rescheduleMeeting(meeting)`: Reschedule meeting date/time
- `deleteMeeting(meeting)`: Remove meeting with confirmation
- `hostMeeting(meeting)`: Start meeting as host
- `onFilterChange()`: Apply filters
- `clearFilters()`: Reset all filters

### Template Design

**Layout Structure:**
1. **Header Section**:
   - Blue gradient background (`#2196F3` to `#1976D2`)
   - Page title and subtitle
   - "Create Meeting" button

2. **Filters Section**:
   - Subject dropdown (lecturer's subjects only)
   - Status dropdown (scheduled/ongoing/completed/cancelled)
   - Clear filters button

3. **Meetings Table**:
   - Topic with description preview
   - Subject name
   - Batch name
   - Date & time
   - Duration in minutes
   - Status badge (color-coded)
   - Student count
   - Action buttons (Host/Edit/Reschedule/Delete)

4. **Pagination**:
   - Configurable page size (5, 10, 25, 50)
   - First/last page navigation

**Table Columns:**
| Column | Description |
|--------|-------------|
| Topic | Meeting title with description snippet |
| Subject | Subject name from populated object |
| Batch | Batch name for student group |
| Date & Time | Scheduled start time |
| Duration | Meeting duration in minutes |
| Status | Color-coded status badge |
| Students | Max student count from batch |
| Actions | Host, Edit, Reschedule, Delete buttons |

### Styling Features

**Color Scheme:**
- Primary: Blue gradient (#2196F3 → #1976D2)
- Hover effects on table rows
- Color-coded status badges:
  - Scheduled: Light blue (#e3f2fd / #1976d2)
  - Ongoing: Green with pulse animation (#e8f5e9 / #388e3c)
  - Completed: Gray (#f5f5f5 / #757575)
  - Cancelled: Red (#ffebee / #c62828)

**Responsive Design:**
- Mobile-friendly layout
- Horizontal scroll on small screens
- Responsive grid for filters
- Touch-friendly buttons

## Access Control & Filtering

### Lecturer-Specific Filtering:
```typescript
// Load only meetings created by this lecturer
const filters: any = {
  lecturerId: this.currentUser._id
};

// Filter subjects to only lecturer's teaching subjects
const response = await this.subjectService.getSubjects({
  lecturer: this.currentUser._id
}).toPromise();
```

### Meeting Dialog Data:
```typescript
// Pass lecturer ID to dialog for subject filtering
this.dialog.open(MeetingDialogComponent, {
  data: { 
    meeting: null, 
    lecturerId: this.currentUser._id 
  }
});
```

## Backend Integration

### Endpoints Used:
1. **GET `/api/meetings?lecturerId={id}`**: Fetch lecturer's meetings
2. **POST `/api/meetings`**: Create new meeting
3. **PUT `/api/meetings/:id`**: Update meeting
4. **DELETE `/api/meetings/:id`**: Delete meeting
5. **PATCH `/api/meetings/:id/start`**: Start meeting (update status)
6. **GET `/api/subjects?lecturer={id}`**: Get lecturer's subjects

### Data Flow:
1. Lecturer logs in (auth token stored)
2. System loads lecturer's subjects
3. Lecturer creates/edits meeting via dialog
4. Dialog restricts subject selection to lecturer's subjects
5. Meeting saved with lecturer ID and subject details
6. Table displays only lecturer's meetings
7. Real-time updates via 60-second polling

## User Actions & Workflows

### Creating a Meeting:
1. Click **"Create Meeting"** button
2. Fill in meeting details:
   - Topic and description
   - Select subject (from lecturer's subjects only)
   - Department/course/batch auto-filled from subject
   - Select modules
   - Pick date and time
   - Set duration
   - Review auto-calculated end time
3. Click **"Create Meeting"**
4. Meeting appears in table with "Scheduled" status

### Editing a Meeting:
1. Find scheduled meeting in table
2. Click **Edit** icon button
3. Modify any fields (same as creation)
4. Click **"Update Meeting"**
5. Table refreshes with updated data

### Rescheduling a Meeting:
1. Click **Reschedule** icon on scheduled meeting
2. Enter new date/time in prompt (YYYY-MM-DDTHH:MM format)
3. System updates start time
4. End time recalculated based on duration

### Deleting a Meeting:
1. Click **Delete** icon (cannot delete ongoing meetings)
2. Confirm deletion in dialog
3. Meeting removed from table

### Hosting a Meeting:
1. Wait until 15 minutes before scheduled time
2. Click **Host Meeting** button (video camera icon)
3. System:
   - Updates status to "ongoing"
   - Opens Daily.co room in new window
   - Adds host privileges to URL
4. Lecturer can now manage meeting room

## Feature Highlights

### Auto-Refresh Mechanism:
```typescript
// Refresh every 60 seconds
this.refreshSubscription = interval(60000).subscribe(() => {
  this.loadMeetings();
});

// Clean up on component destroy
ngOnDestroy() {
  if (this.refreshSubscription) {
    this.refreshSubscription.unsubscribe();
  }
}
```

### Smart Button States:
- **Host**: Only enabled for scheduled meetings 15+ minutes before start
- **Edit**: Only enabled for scheduled meetings
- **Reschedule**: Only enabled for scheduled meetings
- **Delete**: Disabled for ongoing meetings

### Status Badge Animation:
```css
.status-badge.status-ongoing {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

## Differences from Admin Version

| Feature | Admin | Lecturer |
|---------|-------|----------|
| Meeting Access | All meetings | Only lecturer's meetings |
| Subject Selection | All subjects | Only teaching subjects |
| Department Filter | Yes | No (implied by subject) |
| Create Button | Purple gradient | Blue gradient |
| Layout | AdminLayout | LecturerLayout |
| Lecturer Column | Shows all lecturers | Not needed (own meetings) |
| Navigation | Admin sidebar | Lecturer sidebar |

## UI/UX Enhancements

### Visual Feedback:
- **Loading Spinner**: During data fetch
- **Success Notifications**: On successful operations
- **Error Messages**: For failed actions
- **Confirmation Dialogs**: Before destructive actions
- **Disabled States**: For invalid actions
- **Tooltips**: Explain button functions

### Empty States:
```html
<div *ngIf="!loading && meetings.length === 0" class="no-data">
  <mat-icon>event_busy</mat-icon>
  <p>No meetings found</p>
  <button mat-raised-button color="primary" (click)="openCreateMeetingDialog()">
    Create Your First Meeting
  </button>
</div>
```

## Technical Stack

- **Framework**: Angular 17+ (Standalone Components)
- **UI Library**: Angular Material
- **Video Platform**: Daily.co
- **Real-time**: RxJS intervals & subscriptions
- **Forms**: Reactive Forms (via reused MeetingDialogComponent)
- **State Management**: RxJS observables
- **Backend**: Node.js/Express REST API

## Dependencies

### Angular Material Components:
- MatTableModule (data table)
- MatButtonModule (action buttons)
- MatIconModule (icons)
- MatDialogModule (meeting creation/edit)
- MatSelectModule (filters)
- MatFormFieldModule (form inputs)
- MatProgressSpinnerModule (loading)
- MatPaginatorModule (pagination)
- MatTooltipModule (button tooltips)
- MatChipsModule (status badges - legacy)
- MatSnackBarModule (notifications)

### Services:
- MeetingService (CRUD operations)
- SubjectService (lecturer's subjects)
- AuthService (current user)
- ConfirmationService (delete confirmation)

### Shared Components:
- LecturerLayout (page wrapper)
- MeetingDialogComponent (from admin - reused)

## Security & Validation

### Access Control:
✅ Meetings filtered by lecturer ID (backend enforced)
✅ Subject selection limited to teaching subjects
✅ Authentication required (teacherGuard)
✅ Confirmation before deletion

### Time Validation:
✅ Host button enabled only 15 min before start
✅ Cannot edit/delete ongoing meetings
✅ Cannot delete ongoing meetings
✅ Past meetings remain read-only

### Data Validation:
✅ All fields validated in MeetingDialogComponent
✅ Required fields enforced
✅ Date must be in future
✅ Duration 1-480 minutes

## Testing Checklist

- [ ] Lecturer sees only their meetings
- [ ] Create meeting dialog opens correctly
- [ ] Subject dropdown shows only lecturer's subjects
- [ ] Meeting creation succeeds with all fields
- [ ] Table displays created meeting
- [ ] Edit meeting pre-populates all fields
- [ ] Edit saves correctly
- [ ] Reschedule updates date/time
- [ ] Delete confirmation appears
- [ ] Delete removes meeting
- [ ] Host button enables at correct time
- [ ] Host opens Daily.co room
- [ ] Status updates to ongoing when hosted
- [ ] Filters work correctly
- [ ] Pagination functions properly
- [ ] Auto-refresh updates table
- [ ] Mobile responsive layout
- [ ] Error handling for API failures

## Known Limitations

1. **Subject Filtering in Dialog**: 
   - Dialog component (MeetingDialogComponent) is shared with admin
   - Needs to filter subjects based on lecturerId passed in data
   - May need update to MeetingDialogComponent to support this

2. **Module Loading**: 
   - Modules loaded based on selected subject
   - Relies on existing admin dialog logic

3. **Attendance Tracking**: 
   - Currently manual input
   - Future: Auto-track via Daily.co API

## Future Enhancements

1. **Advanced Scheduling**:
   - Recurring meetings
   - Meeting templates
   - Bulk creation

2. **Analytics**:
   - Student attendance reports
   - Meeting duration analytics
   - Engagement metrics

3. **Notifications**:
   - Email reminders to students
   - SMS notifications
   - Push notifications 15 min before meeting

4. **Integration**:
   - Calendar sync (Google Calendar, Outlook)
   - Recording management
   - Automatic attendance from video platform

5. **Enhanced Filtering**:
   - Date range filter
   - Search by topic
   - Sort by multiple columns

## Support & Troubleshooting

### Common Issues:

**Issue**: Cannot see "Create Meeting" button
**Solution**: Ensure user is logged in as lecturer and has teaching subjects assigned

**Issue**: Subject dropdown is empty in dialog
**Solution**: Verify lecturer has subjects assigned in the system

**Issue**: Host button is disabled
**Solution**: Wait until 15 minutes before scheduled meeting time

**Issue**: Meeting not appearing in table
**Solution**: Check filters and ensure meeting was created with current lecturer ID

**Issue**: Cannot edit meeting
**Solution**: Only scheduled meetings can be edited; ongoing/completed cannot be modified

## Changelog

### Version 2.0.0 (November 8, 2025)
- **Major Update**: Complete redesign from card layout to table layout
- Added full CRUD operations (Create, Read, Update, Delete)
- Integrated MeetingDialogComponent from admin
- Added filters (subject, status)
- Added pagination
- Added reschedule functionality
- Replaced routing-based edit with dialog-based edit
- Blue theme to match lecturer interface
- Auto-refresh every 60 seconds
- Improved error handling and user feedback

### Version 1.0.0 (Previous)
- Basic meeting list with card layout
- Start/join/end meeting functionality
- Limited edit capabilities (routing-based)
- No filtering or pagination

---

**Last Updated**: November 8, 2025
**Component**: LecturerLayout > Manage Meetings
**Route**: `/lecturer/meetings`
**Guard**: `teacherGuard`
