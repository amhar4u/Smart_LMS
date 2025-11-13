# Student Subject Level - Quick API Reference

## Base URL
```
http://localhost:3000/api/student-subject-levels
```

## Authentication
All endpoints require authentication token in header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Get All Subjects for a Student
**GET** `/student/:studentId`

**Example:**
```bash
curl http://localhost:3000/api/student-subject-levels/student/65abc123def456789
```

**Response:**
```json
{
  "success": true,
  "message": "Student subject levels retrieved successfully",
  "data": [
    {
      "studentId": { "firstName": "John", "lastName": "Doe" },
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

---

### 2. Get All Students for a Subject (Lecturer View)
**GET** `/subject/:subjectId`

**Example:**
```bash
curl http://localhost:3000/api/student-subject-levels/subject/65xyz789abc123456
```

**Use Case:** Lecturer wants to see all students' performance in their subject

---

### 3. Get Specific Student-Subject Level
**GET** `/student/:studentId/subject/:subjectId`

**Example:**
```bash
curl http://localhost:3000/api/student-subject-levels/student/65abc123/subject/65xyz789
```

---

### 4. Get Performance History
**GET** `/student/:studentId/subject/:subjectId/history`

**Example:**
```bash
curl http://localhost:3000/api/student-subject-levels/student/65abc123/subject/65xyz789/history
```

**Response:**
```json
{
  "success": true,
  "data": {
    "student": { "firstName": "John", "lastName": "Doe" },
    "subject": { "name": "Mathematics", "code": "MATH101" },
    "currentLevel": "intermediate",
    "averagePercentage": 68.5,
    "performanceHistory": [
      {
        "assignmentId": { "title": "Assignment 1" },
        "marks": 60,
        "percentage": 60,
        "level": "intermediate",
        "submittedAt": "2024-01-01"
      },
      {
        "assignmentId": { "title": "Assignment 2" },
        "marks": 75,
        "percentage": 75,
        "level": "advanced",
        "submittedAt": "2024-01-08"
      }
    ],
    "levelChanges": [
      {
        "previousLevel": "beginner",
        "newLevel": "intermediate",
        "changedAt": "2024-01-01"
      }
    ]
  }
}
```

---

### 5. Get with Filters
**GET** `/`

**Query Parameters:**
- `studentId` - Filter by student
- `subjectId` - Filter by subject
- `level` - Filter by level (beginner/intermediate/advanced)
- `minPercentage` - Minimum percentage
- `maxPercentage` - Maximum percentage

**Examples:**
```bash
# Get all beginners
curl http://localhost:3000/api/student-subject-levels?level=beginner

# Get students with 60-80% in subject
curl http://localhost:3000/api/student-subject-levels?subjectId=65xyz789&minPercentage=60&maxPercentage=80

# Get all of student's subjects with advanced level
curl http://localhost:3000/api/student-subject-levels?studentId=65abc123&level=advanced
```

---

### 6. Get Statistics Overview
**GET** `/statistics/overview`

**Query Parameters:**
- `subjectId` - Statistics for specific subject
- `studentId` - Statistics for specific student

**Example:**
```bash
curl http://localhost:3000/api/student-subject-levels/statistics/overview?subjectId=65xyz789
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStudents": 45,
    "levelDistribution": [
      { "_id": "beginner", "count": 10, "avgPercentage": 28.5, "avgMarks": 28.5 },
      { "_id": "intermediate", "count": 25, "avgPercentage": 55.2, "avgMarks": 55.2 },
      { "_id": "advanced", "count": 10, "avgPercentage": 82.7, "avgMarks": 82.7 }
    ],
    "breakdown": {
      "beginner": { "count": 10, "avgPercentage": 28.5 },
      "intermediate": { "count": 25, "avgPercentage": 55.2 },
      "advanced": { "count": 10, "avgPercentage": 82.7 }
    }
  }
}
```

---

## Common Use Cases

### Student Dashboard
```javascript
// Get all my subjects with levels
GET /api/student-subject-levels/student/MY_ID

// Get my history in Mathematics
GET /api/student-subject-levels/student/MY_ID/subject/MATH_ID/history
```

### Lecturer Dashboard
```javascript
// Get all students in my subject
GET /api/student-subject-levels/subject/MY_SUBJECT_ID

// Get only struggling students (beginners)
GET /api/student-subject-levels?subjectId=MY_SUBJECT_ID&level=beginner

// Get class statistics
GET /api/student-subject-levels/statistics/overview?subjectId=MY_SUBJECT_ID
```

### Admin Dashboard
```javascript
// Get all student levels system-wide
GET /api/student-subject-levels

// Get all advanced students
GET /api/student-subject-levels?level=advanced

// Get overall statistics
GET /api/student-subject-levels/statistics/overview
```

---

## Level Definitions

| Level | Percentage Range | Description |
|-------|-----------------|-------------|
| **Beginner** | 0% - 34.99% | Needs significant improvement |
| **Intermediate** | 35% - 70% | Making good progress |
| **Advanced** | 70.01% - 100% | Excellent performance |

---

## How Updates Work

Updates happen **automatically** when assignments are evaluated:

```
Evaluate Assignment
    ↓
POST /api/assignments/:assignmentId/submissions/:submissionId/evaluate
    ↓
AI/Manual Evaluation
    ↓
Save Submission
    ↓
updateStudentSubjectLevel() ← Automatic!
    ↓
Student Level Updated
```

**No manual API call needed!** Just evaluate assignments normally.

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

**HTTP Status Codes:**
- `200` - Success
- `404` - Not found
- `500` - Server error

---

## Testing with curl

### Get student levels
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/student-subject-levels/student/STUDENT_ID
```

### Get subject statistics
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/student-subject-levels/statistics/overview?subjectId=SUBJECT_ID
```

### Filter by level
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:3000/api/student-subject-levels?level=beginner&subjectId=SUBJECT_ID"
```

---

## Database Model

```javascript
StudentSubjectLevel {
  studentId: ObjectId,           // Reference to User
  subjectId: ObjectId,           // Reference to Subject
  averageMarks: Number,          // Average marks obtained
  averagePercentage: Number,     // Average percentage
  level: String,                 // 'beginner' | 'intermediate' | 'advanced'
  totalAssignments: Number,      // Total assignments in subject
  completedAssignments: Number,  // Completed and evaluated
  totalMarksObtained: Number,    // Sum of all marks
  totalMaxMarks: Number,         // Sum of all max marks
  lastAssignmentDate: Date,      // Most recent submission
  performanceHistory: [{         // Array of all assignments
    assignmentId: ObjectId,
    marks: Number,
    percentage: Number,
    level: String,
    submittedAt: Date
  }],
  levelChanges: [{               // Array of level transitions
    previousLevel: String,
    newLevel: String,
    changedAt: Date,
    triggerAssignmentId: ObjectId
  }]
}
```

---

## Quick Reference Card

| What I Want | Endpoint |
|------------|----------|
| See all my subjects | `GET /student/:myId` |
| See my progress in one subject | `GET /student/:myId/subject/:subjectId/history` |
| See all students in my subject (lecturer) | `GET /subject/:subjectId` |
| See struggling students | `GET /?subjectId=X&level=beginner` |
| See top performers | `GET /?subjectId=X&level=advanced` |
| Get class statistics | `GET /statistics/overview?subjectId=X` |
| Filter by percentage | `GET /?minPercentage=60&maxPercentage=80` |

---

**Full Documentation:** See `STUDENT_SUBJECT_LEVEL_TRACKING.md`
