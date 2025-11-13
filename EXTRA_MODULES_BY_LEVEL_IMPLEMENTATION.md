# Extra Modules by Student Level - Implementation Guide

## Overview
This feature displays extra learning resources to students based on their current performance level in each subject. The system automatically shows relevant extra modules that match the student's level (Beginner, Intermediate, or Advanced).

## How It Works

### 1. Student Level Tracking
- When a student completes assignments, their performance is tracked in the `StudentSubjectLevel` collection
- The system automatically calculates the student's level based on their average percentage:
  - **Beginner**: < 35%
  - **Intermediate**: 35% - 70%
  - **Advanced**: > 70%

### 2. Extra Module Filtering
- Extra modules are created by lecturers/admins and tagged with a specific level (Beginner, Intermediate, Advanced, or All)
- When a student views a subject detail page, the system:
  1. Fetches the student's current level for that subject
  2. Retrieves extra modules that match:
     - The same subject ID
     - The student's current level OR modules marked as "All"

### 3. Display Logic
- Extra modules appear in a new "Extra Resources" tab on the subject detail page
- Students see:
  - Their current level badge
  - Only the extra modules relevant to their level
  - Documents (PDFs) and videos for each module
  - Empty state if no modules are available for their level

## Implementation Details

### Backend

#### Models
1. **StudentSubjectLevel** (`backend/models/StudentSubjectLevel.js`)
   - Tracks student performance per subject
   - Automatically calculates level based on average percentage
   - Stores performance history and level changes

2. **ExtraModule** (`backend/models/ExtraModule.js`)
   - Stores extra learning resources
   - Has `studentLevel` field: Beginner, Intermediate, Advanced, or All
   - Has `subject` field to link to a specific subject
   - Supports multiple documents and one video

#### API Endpoints

1. **Get Student Subject Level**
   ```
   GET /api/student-subject-levels/student/:studentId/subject/:subjectId
   ```
   - Returns the student's level for a specific subject

2. **Get Extra Modules (Filtered)**
   ```
   GET /api/extra-modules?subject=:subjectId&studentLevel=:level
   ```
   - Returns extra modules filtered by subject and level
   - Includes modules marked as "All" for any level

### Frontend

#### New Service
**StudentSubjectLevelService** (`frontend/src/app/services/student-subject-level.service.ts`)
- Provides methods to fetch student subject levels
- Handles API communication for level tracking
- Includes utility methods for level formatting

#### Updated Component
**StudentSubjectDetail** (`frontend/src/app/component/student/student-subject-detail/`)
- Added new properties:
  - `studentLevel`: Current student level for the subject
  - `extraModules`: List of filtered extra modules
  - `loadingExtraModules`: Loading state flag

- Added new methods:
  - `loadStudentLevel()`: Fetches student's level from API
  - `loadExtraModules()`: Fetches extra modules based on level
  - `capitalizeFirstLetter()`: Utility for string formatting
  - `getLevelBadgeClass()`: Returns CSS class for level badge

#### Updated Template
- Added new "Extra Resources" tab with:
  - Student level badge showing current level
  - Description text explaining the feature
  - Accordion of extra modules (similar to regular modules)
  - Empty state when no modules are available
  - Loading state during data fetch

#### New CSS Styles
- `.student-level-info`: Container for level badge and description
- `.level-beginner`, `.level-intermediate`, `.level-advanced`, `.level-all`: Badge colors
- `.extra-module-panel`: Special styling for extra module panels
- `.module-code`: Badge for extra module code
- `.hint`: Italic text for helpful hints

## Usage Flow

### For Students
1. Student logs in and navigates to a subject detail page
2. System automatically fetches their performance level for that subject
3. Student sees a new "Extra Resources" tab with a count
4. Opens the tab to see:
   - Current level badge (e.g., "Your Level: Intermediate")
   - Extra modules matching their level
   - Documents and videos to study
5. If no modules available, sees encouraging message to keep completing assignments

### For Lecturers/Admins
1. Create extra modules via the "Manage Extra Modules" interface
2. Assign each module to:
   - A specific subject
   - A target student level (Beginner, Intermediate, Advanced, or All)
3. Upload PDF documents and optional videos
4. Students at the matching level will automatically see these modules

## Database Schema

### StudentSubjectLevel
```javascript
{
  studentId: ObjectId,
  subjectId: ObjectId,
  level: 'beginner' | 'intermediate' | 'advanced',
  averagePercentage: Number (0-100),
  averageMarks: Number,
  completedAssignments: Number,
  totalMarksObtained: Number,
  totalMaxMarks: Number,
  performanceHistory: Array,
  levelChanges: Array,
  lastAssignmentDate: Date
}
```

### ExtraModule
```javascript
{
  title: String,
  name: String,
  code: String,
  description: String,
  subject: ObjectId (ref: Subject),
  studentLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'All',
  documents: [{
    name: String,
    cloudinaryURL: String,
    publicId: String,
    fileType: String,
    size: Number
  }],
  video: {
    name: String,
    cloudinaryURL: String,
    publicId: String,
    duration: Number
  },
  order: Number,
  isActive: Boolean,
  createdBy: ObjectId
}
```

## Level Calculation Algorithm

```javascript
calculateLevel() {
  if (averagePercentage < 35) {
    return 'beginner';
  } else if (averagePercentage >= 35 && averagePercentage <= 70) {
    return 'intermediate';
  } else {
    return 'advanced';
  }
}
```

## API Filter Logic

The backend filters extra modules using MongoDB query:
```javascript
filter.studentLevel = { $in: [studentLevel, 'All'] };
```

This ensures students see:
- Modules specifically for their level
- Modules marked as "All" (suitable for everyone)

## Benefits

1. **Personalized Learning**: Students get resources tailored to their skill level
2. **Motivation**: Clear progression system encourages improvement
3. **Efficiency**: Students don't get overwhelmed by advanced content or bored by basic content
4. **Automatic**: No manual assignment needed - system handles it based on performance
5. **Flexibility**: Lecturers can create modules for any level and subject

## Future Enhancements

Possible improvements:
- Email notifications when new extra modules are added for student's level
- Progress tracking for extra module completion
- Recommendations based on struggling topics
- Gamification with badges for level progression
- Analytics dashboard showing module usage by level

## Testing

To test the feature:
1. Create a student account
2. Complete some assignments to establish a level
3. Check `/api/student-subject-levels/student/:studentId/subject/:subjectId` to verify level
4. Create extra modules as lecturer/admin for different levels
5. View subject detail page as student to see filtered modules
6. Complete more assignments to change level and verify modules update

## Troubleshooting

**Issue**: No extra modules showing
- **Check**: Student has completed at least one assignment to have a level assigned
- **Check**: Extra modules exist for that subject and level
- **Check**: Extra modules are marked as `isActive: true`

**Issue**: Wrong modules showing
- **Check**: Extra module `studentLevel` field matches student's level
- **Check**: Extra module `subject` field matches current subject ID
- **Check**: Level calculation is correct based on average percentage

**Issue**: Level not updating
- **Check**: Assignment was evaluated and marked
- **Check**: `StudentSubjectLevel` document exists for student-subject pair
- **Check**: `updatePerformance()` method is called after assignment evaluation
