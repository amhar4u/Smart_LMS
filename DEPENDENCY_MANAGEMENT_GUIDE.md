# Dependency Management System - Testing Guide

## Overview
The system now implements comprehensive dependency checking before deletion to prevent data loss and orphaned records.

## Architecture

### Backend (`/backend/routes/dependencies.js`)
- Centralized dependency checking endpoints
- Returns dependency counts and lists
- Flags entities as `canDelete` or `requiresConfirmation`

### Frontend
- **Service**: `dependency.service.ts` - API calls
- **Component**: `dependency-dialog.component.ts` - UI modal
- **Enhanced**: `confirmation.service.ts` - Integrated dependency checks

## Dependency Chain

```
Department
  ├── Courses
  ├── Students
  ├── Lecturers
  └── Subjects

Course
  ├── Batches
  └── Subjects

Batch
  ├── Semesters
  ├── Students
  └── Subjects

Semester
  └── Subjects

Subject
  ├── Modules
  ├── Extra Modules
  ├── Assignments
  ├── Meetings
  └── Student Levels

Student (Leaf - requires DELETE confirmation)
  ├── Submissions
  ├── Attendance
  └── Student Levels

Lecturer
  ├── Subjects
  └── Meetings

Assignment (Leaf - requires DELETE confirmation)
  └── Submissions

Module
  ├── Meetings
  └── Assignments

Meeting (Leaf - requires DELETE confirmation)
  └── Attendance Records
```

## Testing Scenarios

### 1. Test Blocking Parent Deletion
**Scenario**: Try to delete a department with courses
**Expected**: 
- Modal shows warning icon
- Lists all dependent courses with counts
- Delete button is NOT shown
- Message: "Cannot delete" with action required
- Close button only

**Test Command** (via browser):
1. Navigate to Admin > Departments
2. Click delete on a department that has courses
3. Verify modal blocks deletion

### 2. Test Leaf Record with DELETE Confirmation
**Scenario**: Delete a student with submissions
**Expected**:
- Modal shows info/warning
- Lists dependent data (submissions, attendance)
- Shows input box: "Type DELETE to confirm"
- Delete button enabled only when "DELETE" is typed
- Proceeds with deletion after confirmation

**Test Command**:
1. Navigate to Admin > Students
2. Click delete on a student with data
3. Type "DELETE" in input box
4. Verify delete proceeds

### 3. Test Empty Parent Deletion
**Scenario**: Delete a semester with no subjects
**Expected**:
- Modal shows simple confirmation
- No dependencies listed
- Delete proceeds immediately

### 4. Test Backend Endpoints

```bash
# Test from backend directory
cd backend

# Start server
npm start

# In another terminal, test endpoints (replace IDs):
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/dependencies/department/DEPT_ID

curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/dependencies/subject/SUBJECT_ID

curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/dependencies/student/STUDENT_ID
```

## Manual Testing Checklist

### Backend Tests
- [ ] Department with courses - returns courses array
- [ ] Course with batches - returns batches array
- [ ] Batch with students - returns students array
- [ ] Semester with subjects - returns subjects array
- [ ] Subject with modules - returns modules array
- [ ] Student with submissions - returns requiresConfirmation: true
- [ ] Empty entity - returns canDelete: true

### Frontend Tests
- [ ] Dependency modal displays correctly
- [ ] Icons and colors appropriate (warning = orange, info = blue)
- [ ] Expansion panels work for dependency lists
- [ ] DELETE input validation works
- [ ] Delete button disabled until "DELETE" typed
- [ ] Successful deletion shows success message
- [ ] Blocked deletion shows appropriate message

### Integration Tests
- [ ] Departments page uses dependency check
- [ ] Courses page uses dependency check
- [ ] Batches page uses dependency check
- [ ] Semesters page uses dependency check
- [ ] Subjects page uses dependency check
- [ ] Students page uses dependency check (when implemented)

## Component Integration Status

✅ **Implemented**:
- `manage-departments.component.ts`
- `manage-courses.component.ts`
- `manage-batches.component.ts`
- `manage-semesters.component.ts`
- `manage-subjects.component.ts`

⚠️ **Needs Implementation**:
- `manage-students.component.ts` (if exists)
- `manage-lecturers.component.ts` (if exists)
- `manage-assignments.component.ts` (if exists)
- `manage-modules.component.ts` (if exists)
- `manage-meetings.component.ts` (if exists)

## Known Limitations

1. **Performance**: For entities with thousands of dependents, consider pagination
2. **Cascading**: Currently blocks deletion; consider adding "reassign" feature
3. **Soft Delete**: Alternative to hard deletion for audit trails

## Troubleshooting

### Modal doesn't open
- Check if `DependencyDialogComponent` is properly imported
- Verify Material Dialog module is imported
- Check console for errors

### Dependencies not loading
- Verify backend route is registered in `server.js`
- Check authentication token
- Verify entity ID is correct
- Check network tab for API response

### DELETE confirmation not working
- Verify input value matches exactly "DELETE" (case-sensitive)
- Check `canProceedWithDelete` getter in component
- Ensure `requiresConfirmation` flag is set in backend

## Next Steps

1. Test all scenarios with real data
2. Add remaining management components
3. Consider adding "Reassign" feature for some entities
4. Add loading states during dependency checks
5. Implement error retry mechanism
6. Add analytics/logging for deletion attempts
