# Student Subject Level Tracking - Implementation Guide

## Overview
This feature automatically tracks student performance across assignments for each subject, calculating average marks, percentages, and assigning proficiency levels (beginner, intermediate, advanced).

## Architecture

### 1. Database Model
**File:** `backend/models/StudentSubjectLevel.js`

**Schema Fields:**
- `studentId` - Reference to User (student)
- `subjectId` - Reference to Subject
- `averageMarks` - Average marks obtained across all assignments
- `averagePercentage` - Average percentage across all assignments
- `level` - Proficiency level: 'beginner' (<35%), 'intermediate' (35-70%), 'advanced' (>70%)
- `totalAssignments` - Total assignments created for this subject
- `completedAssignments` - Number of assignments completed and evaluated
- `totalMarksObtained` - Sum of all marks obtained
- `totalMaxMarks` - Sum of all maximum marks possible
- `lastAssignmentDate` - Date of most recent submission
- `performanceHistory` - Array of assignment results with:
  - assignmentId
  - marks
  - percentage
  - level
  - submittedAt
- `levelChanges` - Array tracking level transitions:
  - previousLevel
  - newLevel
  - changedAt
  - triggerAssignmentId

**Indexes:**
- Unique compound index on `studentId` + `subjectId`
- Index on `subjectId` for lecturer queries
- Index on `level` for filtering

### 2. Business Logic Service
**File:** `backend/services/studentSubjectLevelService.js`

**Core Functions:**

#### `updateStudentSubjectLevel(studentId, assignmentId, marks, percentage, level)`
Automatically called after assignment evaluation to update student performance.

**Process:**
1. Finds assignment and subject details
2. Finds or creates StudentSubjectLevel record
3. Checks if assignment already evaluated (prevents duplicates)
4. Updates or adds to performance history
5. Recalculates averages:
   - `averageMarks = totalMarksObtained / completedAssignments`
   - `averagePercentage = (totalMarksObtained / totalMaxMarks) * 100`
6. Determines new level based on percentage
7. Tracks level changes if level changed
8. Saves and returns updated record

#### `getStudentSubjectLevel(studentId, subjectId)`
Retrieves specific student-subject performance record with populated references.

#### `getStudentAllSubjectLevels(studentId)`
Gets all subject levels for a student, useful for student dashboard.

#### `getSubjectStudentLevels(subjectId)`
Gets all student levels for a subject, useful for lecturer to see class performance.

### 3. API Integration

#### Automatic Updates (on evaluation)
**Files Modified:**
- `backend/routes/assignments.js` (line ~850 and ~940)

**Integration Points:**
1. **Single Evaluation Endpoint:** `POST /api/assignments/:assignmentId/submissions/:submissionId/evaluate`
   - After successful AI evaluation and submission save
   - Calls `updateStudentSubjectLevel()` with evaluation results
   - Wrapped in try-catch to prevent evaluation failure if level update fails

2. **Bulk Evaluation Endpoint:** `POST /api/assignments/:assignmentId/submissions/evaluate-all`
   - After each individual submission evaluation
   - Same error handling strategy

**Error Handling:**
```javascript
try {
  await updateStudentSubjectLevel(
    submission.studentId,
    assignmentId,
    evaluation.marks,
    evaluation.percentage,
    evaluation.level
  );
  console.log('✅ Student subject level updated successfully');
} catch (levelError) {
  console.error('⚠️ Failed to update student subject level:', levelError);
  // Don't fail the evaluation if level update fails
}
```

### 4. API Endpoints
**File:** `backend/routes/studentSubjectLevels.js`

**Available Endpoints:**

#### GET `/api/student-subject-levels/student/:studentId`
Get all subjects for a student with their performance levels.

**Response:**
```json
{
  "success": true,
  "message": "Student subject levels retrieved successfully",
  "data": [
    {
      "_id": "...",
      "studentId": { "firstName": "John", "lastName": "Doe", ... },
      "subjectId": { "name": "Mathematics", "code": "MATH101" },
      "averageMarks": 75,
      "averagePercentage": 75,
      "level": "advanced",
      "completedAssignments": 5,
      "totalAssignments": 6
    }
  ]
}
```

#### GET `/api/student-subject-levels/subject/:subjectId`
Get all students for a subject (lecturer view).

**Use Case:** Lecturer can see entire class performance distribution.

#### GET `/api/student-subject-levels/student/:studentId/subject/:subjectId`
Get specific student-subject level details.

#### GET `/api/student-subject-levels/:id`
Get by record ID with full population including performance history.

#### GET `/api/student-subject-levels`
Get all records with optional filters:
- `?studentId=...` - Filter by student
- `?subjectId=...` - Filter by subject
- `?level=beginner|intermediate|advanced` - Filter by level
- `?minPercentage=60` - Filter by minimum percentage
- `?maxPercentage=80` - Filter by maximum percentage

#### GET `/api/student-subject-levels/student/:studentId/subject/:subjectId/history`
Get detailed performance history for a student in a subject.

**Response includes:**
- Current level and averages
- Full performance history with assignment details
- Level change timeline

#### GET `/api/student-subject-levels/statistics/overview`
Get statistics overview with optional filters.

**Query Parameters:**
- `?subjectId=...` - Statistics for specific subject
- `?studentId=...` - Statistics for specific student

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStudents": 45,
    "levelDistribution": [
      { "_id": "beginner", "count": 10, "avgPercentage": 28.5 },
      { "_id": "intermediate", "count": 25, "avgPercentage": 55.2 },
      { "_id": "advanced", "count": 10, "avgPercentage": 82.7 }
    ],
    "breakdown": {
      "beginner": { "count": 10, "avgPercentage": 28.5 },
      "intermediate": { "count": 25, "avgPercentage": 55.2 },
      "advanced": { "count": 10, "avgPercentage": 82.7 }
    }
  }
}
```

## Level Calculation Logic

### Determination Rules
```javascript
const determineLevel = (percentage) => {
  if (percentage < 35) return 'beginner';
  if (percentage >= 35 && percentage <= 70) return 'intermediate';
  return 'advanced';
};
```

### Level Thresholds
- **Beginner:** 0% - 34.99%
- **Intermediate:** 35% - 70%
- **Advanced:** 70.01% - 100%

### Level Change Tracking
When a student's level changes:
```javascript
levelChanges.push({
  previousLevel: 'beginner',
  newLevel: 'intermediate',
  changedAt: new Date(),
  triggerAssignmentId: assignmentId
});
```

## Usage Examples

### Backend Usage

#### 1. After Manual Evaluation (if implemented)
```javascript
// In manual evaluation endpoint
const result = await updateStudentSubjectLevel(
  submission.studentId,
  assignmentId,
  manualMarks,
  calculatedPercentage,
  determinedLevel
);
```

#### 2. Get Student Progress
```javascript
const levels = await getStudentAllSubjectLevels(studentId);
// Returns array of all subjects with performance data
```

#### 3. Get Class Performance
```javascript
const classPerformance = await getSubjectStudentLevels(subjectId);
// Returns array of all students with their levels in this subject
```

### Frontend Integration (To Be Implemented)

#### Student Dashboard Component
```typescript
// Get student's all subject levels
this.studentService.getSubjectLevels(studentId).subscribe(levels => {
  this.subjectLevels = levels;
  this.calculateOverallProgress();
});

// Get detailed history for one subject
this.studentService.getSubjectHistory(studentId, subjectId).subscribe(history => {
  this.renderPerformanceChart(history.performanceHistory);
  this.showLevelChanges(history.levelChanges);
});
```

#### Lecturer Dashboard Component
```typescript
// Get all students' performance in subject
this.lecturerService.getSubjectStudentLevels(subjectId).subscribe(students => {
  this.studentsPerformance = students;
  this.calculateClassStatistics();
});

// Get subject statistics
this.statisticsService.getSubjectStatistics(subjectId).subscribe(stats => {
  this.renderLevelDistributionChart(stats.levelDistribution);
});
```

## Database Queries

### Find Students Struggling in a Subject
```javascript
const strugglingStudents = await StudentSubjectLevel.find({
  subjectId: subjectId,
  level: 'beginner',
  completedAssignments: { $gte: 3 } // At least 3 assignments completed
})
.populate('studentId', 'firstName lastName email')
.sort({ averagePercentage: 1 });
```

### Find Top Performers
```javascript
const topPerformers = await StudentSubjectLevel.find({
  subjectId: subjectId,
  level: 'advanced'
})
.populate('studentId', 'firstName lastName')
.sort({ averagePercentage: -1 })
.limit(10);
```

### Track Student Improvement
```javascript
const studentProgress = await StudentSubjectLevel.findOne({
  studentId: studentId,
  subjectId: subjectId
}).populate('performanceHistory.assignmentId', 'title dueDate');

// Analyze trend
const trend = studentProgress.performanceHistory.map(h => ({
  date: h.submittedAt,
  percentage: h.percentage,
  level: h.level
}));
```

## Testing

### Manual Testing Steps

1. **Create an assignment** with questions
2. **Student submits** assignment answers
3. **Lecturer/Admin evaluates** the submission (triggers level update)
4. **Check database:**
   ```javascript
   db.studentsubjectlevels.find({ studentId: ObjectId("...") })
   ```
5. **Verify:**
   - Record created/updated
   - Average calculated correctly
   - Level assigned correctly
   - Performance history added
   - Level change tracked if applicable

### Test Scenarios

#### Scenario 1: First Assignment
- Student: New student
- Subject: Mathematics
- Assignment: 80/100
- Expected: Level = 'advanced', averagePercentage = 80%

#### Scenario 2: Level Improvement
- Student: Existing (beginner at 30%)
- New assignment: 70/100
- Expected: Level changes to 'intermediate', levelChanges array updated

#### Scenario 3: Re-evaluation
- Existing submission re-evaluated
- Expected: Performance history updated (not duplicated), averages recalculated

#### Scenario 4: Multiple Assignments
- Student completes 5 assignments: 60, 75, 80, 70, 85
- Expected: averagePercentage = 74%, level = 'advanced'

## Monitoring and Logs

### Success Logs
```
✅ Student subject level updated successfully
```

### Error Logs
```
⚠️ Failed to update student subject level: [error message]
```

### Database Queries Log
Service logs each operation:
- Finding assignment
- Finding/creating level record
- Calculating averages
- Determining level changes

## Future Enhancements

### 1. Frontend Components
- Student progress dashboard with charts
- Lecturer class performance analytics
- Admin system-wide statistics

### 2. Notification System
- Alert student when level changes
- Notify lecturer of struggling students
- Weekly progress reports

### 3. Predictive Analytics
- Predict student performance trends
- Identify at-risk students early
- Recommend intervention strategies

### 4. Gamification
- Achievement badges for level ups
- Leaderboards per subject
- Progress milestones

### 5. Reporting
- Generate PDF progress reports
- Export performance data to Excel
- Compare student performance across semesters

## Troubleshooting

### Issue: Level not updating after evaluation
**Check:**
1. Evaluation completed successfully
2. No errors in console logs
3. StudentSubjectLevel record exists in database
4. Assignment has correct subject reference

### Issue: Incorrect averages
**Check:**
1. All submissions have correct marks and maxMarks
2. Performance history doesn't have duplicates
3. totalMarksObtained and totalMaxMarks calculated correctly

### Issue: Level changes not tracked
**Check:**
1. Previous level stored before calculation
2. New level different from previous
3. levelChanges array structure correct

## Security Notes

- All endpoints protected with `auth` middleware
- Students can only view their own levels (implement in frontend)
- Lecturers can only view levels for their subjects
- Admins have full access

## Performance Considerations

- Unique index on studentId + subjectId ensures fast lookups
- Populate operations cached where possible
- Aggregation queries optimized for statistics
- Consider pagination for large datasets

## Configuration

### Environment Variables
No additional environment variables needed. Uses existing MongoDB connection.

### Database Indexes
Automatically created on first document insert:
```javascript
{ studentId: 1, subjectId: 1 } // unique
{ subjectId: 1 } // for lecturer queries
{ level: 1 } // for filtering
```

## API Response Standards

All endpoints follow consistent response format:
```javascript
{
  success: boolean,
  message: string,
  data: object | array,
  error?: string // Only on error
}
```

## Conclusion

The Student Subject Level tracking system is now fully implemented and integrated. It automatically tracks student performance across all assignments per subject, providing valuable insights for students, lecturers, and administrators. The system is designed to be extensible and can be enhanced with additional features as needed.

## Quick Start Checklist

- [x] Database model created
- [x] Service layer implemented
- [x] API endpoints created
- [x] Integration with evaluation endpoints
- [x] Route registered in server.js
- [x] Error handling implemented
- [x] Documentation completed
- [ ] Frontend components (pending)
- [ ] Unit tests (pending)
- [ ] Integration tests (pending)
