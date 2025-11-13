# Assignment Management - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Admin Assignment Management](#admin-assignment-management)
3. [Lecturer Assignment Management](#lecturer-assignment-management)
4. [Student Assignment Submission](#student-assignment-submission)
5. [Assignment Evaluation System](#assignment-evaluation-system)
6. [Student Subject Level Tracking](#student-subject-level-tracking)
7. [Technical Implementation](#technical-implementation)
8. [API Reference](#api-reference)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Smart LMS Assignment System provides comprehensive functionality for creating, managing, submitting, and evaluating assignments with AI-powered automatic grading.

### Key Features
- ✅ Create assignments with multiple question types (MCQ, Short Answer, Essay)
- ✅ AI-powered question generation
- ✅ Student submission with file uploads
- ✅ Automatic evaluation with AI
- ✅ Manual grading override capabilities
- ✅ Student performance tracking and level assignment
- ✅ Comprehensive analytics and reporting

---

## Admin Assignment Management

### Creating Assignments

Admins have full control over all assignments in the system.

#### Assignment Details
- **Title**: Assignment name
- **Description**: Detailed instructions
- **Subject**: Associated subject/course
- **Total Marks**: Maximum achievable marks
- **Due Date**: Submission deadline
- **Duration**: Time limit (in minutes)

#### Question Types

**1. Multiple Choice Questions (MCQ)**
```javascript
{
  type: "MCQ",
  question: "What is 2 + 2?",
  options: ["2", "3", "4", "5"],
  correctAnswer: "4",
  marks: 5
}
```

**2. Short Answer Questions**
```javascript
{
  type: "short_answer",
  question: "Explain the concept of inheritance.",
  marks: 10,
  keywords: ["parent", "child", "extends", "reuse"]
}
```

**3. Essay Questions**
```javascript
{
  type: "essay",
  question: "Discuss the importance of data structures.",
  marks: 20,
  rubric: "Evaluate based on understanding, examples, and clarity"
}
```

### AI Question Generation

Admins can use AI to generate questions automatically:

1. Enter assignment topic
2. Select question types
3. Specify number of questions
4. AI generates relevant questions with answers
5. Review and edit before saving

### Viewing Submissions

**Admin Submission View Features:**
- View all student submissions across all subjects
- Filter by:
  - Subject
  - Status (pending, completed, failed)
  - Student
  - Date range
- Bulk evaluation capabilities
- Export submissions to Excel

**Submission Card View:**
```
┌─────────────────────────────────────┐
│ Student Name                        │
│ Assignment: Title                   │
│ Subject: DSA                        │
│ Submitted: 2024-01-15               │
│ Status: ⚪ Pending / ✅ Evaluated  │
│ Score: 45/50 (90%)                 │
│ Level: 🟢 Advanced                 │
│ [View Details] [Evaluate]          │
└─────────────────────────────────────┘
```

### Evaluation Process

**Single Evaluation:**
1. Click "View Details" on submission card
2. Review student answers
3. Click "Evaluate with AI"
4. AI analyzes answers and provides:
   - Marks per question
   - Total marks
   - Percentage
   - Level (beginner/intermediate/advanced)
   - Detailed feedback
5. Review and publish results

**Bulk Evaluation:**
1. Click "Evaluate All Pending"
2. System evaluates all pending submissions for an assignment
3. View evaluation summary
4. Publish all results at once

---

## Lecturer Assignment Management

### Access Control

Lecturers can only:
- Create assignments for their assigned subjects
- View submissions for their subjects only
- Evaluate submissions for their subjects

### Creating Assignments

Same process as admin, but limited to assigned subjects:
1. Navigate to "Create Assignment"
2. Select from assigned subjects only
3. Add questions (manual or AI-generated)
4. Set due date and duration
5. Publish assignment

### Managing Submissions

**Lecturer Dashboard Features:**
- View submissions for assigned subjects only
- Same card-based UI as admin
- Real-time evaluation status
- Performance analytics per subject

**Submission Management:**
```
My Assignments
├── DSA Assignment 1
│   ├── Pending: 5 students
│   ├── Evaluated: 20 students
│   └── Average: 75%
└── DSA Assignment 2
    ├── Pending: 15 students
    ├── Evaluated: 10 students
    └── Average: 68%
```

### Quick Start Guide for Lecturers

**Step 1: Create Assignment**
```
Dashboard → Assignments → Create New
- Enter title and description
- Select your subject
- Add questions or use AI
- Set deadline and duration
- Save & Publish
```

**Step 2: Monitor Submissions**
```
Dashboard → Assignment Submissions
- View pending submissions
- Check student performance
- Track submission statistics
```

**Step 3: Evaluate Submissions**
```
Click submission card → View Details
- Review answers
- Evaluate with AI or manually
- Add feedback
- Publish results
```

**Step 4: Track Performance**
```
View subject-wise student performance
- Beginner students: Need attention
- Intermediate: On track
- Advanced: Excelling
```

---

## Student Assignment Submission

### Viewing Available Assignments

Students see assignments for their enrolled subjects:
```
Available Assignments
├── Pending (Not Submitted)
│   ├── DSA Assignment 1 - Due: 2024-01-20
│   └── Database Assignment 2 - Due: 2024-01-25
├── In Progress (Started)
│   └── Algorithm Assignment - Time Left: 45 min
└── Submitted
    ├── Data Structures Quiz - Score: 85%
    └── Programming Test - Pending Evaluation
```

### Submission Process

**Step 1: Start Assignment**
- Click "Start Assignment"
- Timer begins (if duration set)
- Cannot pause once started

**Step 2: Answer Questions**
- MCQ: Select one option
- Short Answer: Text input (word limit may apply)
- Essay: Rich text editor

**Step 3: Submit**
- Review all answers
- Click "Submit Assignment"
- Confirmation dialog
- Cannot edit after submission

### Submission Types

**1. Question-Based Submission**
- Answer questions directly in the system
- Auto-save every 30 seconds
- Time tracking

**2. File Upload Submission**
- Upload PDF/DOC/DOCX
- File size limit: 10MB
- Supported formats specified

**3. Text Submission**
- Long-form text entry
- Character limit: 10,000
- Rich text formatting

### Viewing Results

After evaluation:
```
Assignment Results
├── Score: 45/50 (90%)
├── Level: Advanced
├── Feedback: "Excellent understanding..."
├── Question-wise Breakdown:
│   ├── Q1: 5/5 ✓
│   ├── Q2: 8/10 (Good, but...)
│   └── Q3: 15/15 ✓
└── Performance Trend: ↗️ Improving
```

---

## Assignment Evaluation System

### AI-Powered Evaluation

**How It Works:**
1. Student submits assignment
2. System sends to OpenAI GPT-4
3. AI analyzes:
   - MCQ: Automatic correct/incorrect
   - Short Answer: Keyword matching + context
   - Essay: Rubric-based evaluation
4. Generates:
   - Marks per question
   - Total score and percentage
   - Proficiency level
   - Detailed feedback

**AI Evaluation Prompt:**
```javascript
Evaluate this assignment submission:

Assignment: [Title]
Subject: [Subject]
Total Marks: [X]

Questions and Student Answers:
[Q1] [Type] [Marks] [Question]
Student Answer: [Answer]
Correct Answer/Keywords: [Expected]

Provide:
1. Marks for each question
2. Justification
3. Overall feedback
4. Level (beginner/intermediate/advanced)
```

### Manual Evaluation Override

Lecturers/Admins can:
1. Override AI-assigned marks
2. Add custom feedback
3. Adjust individual question scores
4. Re-evaluate submissions

### Evaluation Status Flow

```
Submission Created (pending)
    ↓
Evaluation Started (evaluating)
    ↓
AI Processing
    ↓
Evaluation Complete (completed)
    ↓
Published to Student
    ↓
Student Views Results
```

### Grading Rubric

**Automatic Level Assignment:**
- **Beginner** (0-34%): Needs significant improvement
- **Intermediate** (35-70%): Good progress, room for growth
- **Advanced** (71-100%): Excellent understanding

---

## Student Subject Level Tracking

### Overview

The system automatically tracks student performance per subject and assigns proficiency levels.

### What's Tracked

**For Each Student-Subject Combination:**
- Average marks across all assignments
- Average percentage
- Current proficiency level
- Total assignments available
- Completed assignments
- Performance history (every assignment)
- Level change timeline

### Automatic Updates

After each assignment evaluation:
```
Evaluation Complete
    ↓
Update Student Subject Level
    ↓
Calculate New Average
    ↓
Determine New Level
    ↓
Track Level Change (if changed)
    ↓
Store Performance History
```

### Level Calculation

```javascript
// Automatic calculation
averagePercentage = (totalMarksObtained / totalMaxMarks) × 100

if (averagePercentage < 35) {
  level = "beginner"
} else if (averagePercentage <= 70) {
  level = "intermediate"
} else {
  level = "advanced"
}
```

### Performance History

Each student-subject record stores:
```javascript
{
  studentId: "...",
  subjectId: "...",
  averageMarks: 68.5,
  averagePercentage: 68.5,
  level: "intermediate",
  completedAssignments: 5,
  totalAssignments: 6,
  performanceHistory: [
    { assignmentId: "...", marks: 60, percentage: 60, level: "intermediate", date: "..." },
    { assignmentId: "...", marks: 75, percentage: 75, level: "advanced", date: "..." },
    { assignmentId: "...", marks: 70, percentage: 70, level: "intermediate", date: "..." }
  ],
  levelChanges: [
    { from: "beginner", to: "intermediate", date: "...", trigger: "assignment_2" },
    { from: "intermediate", to: "advanced", date: "...", trigger: "assignment_4" }
  ]
}
```

### Use Cases

**For Students:**
- View progress in all subjects
- See performance trends
- Track level improvements
- Identify weak areas

**For Lecturers:**
- Identify struggling students
- Monitor class performance
- Personalized intervention
- Generate progress reports

**For Admins:**
- System-wide analytics
- Subject difficulty analysis
- Department comparisons
- Success metrics

---

## Technical Implementation

### Database Models

#### Assignment Model
```javascript
{
  title: String,
  description: String,
  subject: ObjectId (ref: Subject),
  questions: [QuestionSchema],
  totalMarks: Number,
  dueDate: Date,
  duration: Number,
  createdBy: ObjectId (ref: User),
  createdAt: Date
}
```

#### AssignmentSubmission Model
```javascript
{
  assignmentId: ObjectId (ref: Assignment),
  studentId: ObjectId (ref: User),
  submittedAnswers: [AnswerSchema],
  marks: Number,
  percentage: Number,
  level: String (enum: beginner/intermediate/advanced),
  feedback: String,
  evaluationStatus: String (enum: pending/evaluating/completed/failed),
  submittedAt: Date,
  gradedAt: Date,
  gradedBy: ObjectId (ref: User)
}
```

#### StudentSubjectLevel Model
```javascript
{
  studentId: ObjectId (ref: User),
  subjectId: ObjectId (ref: Subject),
  averageMarks: Number,
  averagePercentage: Number,
  level: String (enum: beginner/intermediate/advanced),
  totalAssignments: Number,
  completedAssignments: Number,
  totalMarksObtained: Number,
  totalMaxMarks: Number,
  lastAssignmentDate: Date,
  performanceHistory: [PerformanceSchema],
  levelChanges: [LevelChangeSchema]
}
```

### Backend Services

#### AI Evaluation Service
```javascript
// backend/services/aiService.js
async function evaluateAssignment(assignment, submittedAnswers) {
  // Prepare prompt for OpenAI
  // Call GPT-4 API
  // Parse response
  // Return evaluation object
}
```

#### Student Level Service
```javascript
// backend/services/studentSubjectLevelService.js
async function updateStudentSubjectLevel(studentId, assignmentId, marks, percentage, level) {
  // Find or create level record
  // Update performance history
  // Recalculate averages
  // Determine new level
  // Track level changes
  // Save and return
}
```

### API Endpoints

#### Assignment Endpoints
```
POST   /api/assignments                          - Create assignment
GET    /api/assignments                          - Get all assignments
GET    /api/assignments/:id                      - Get assignment by ID
PUT    /api/assignments/:id                      - Update assignment
DELETE /api/assignments/:id                      - Delete assignment
GET    /api/assignments/subject/:subjectId       - Get by subject
```

#### Submission Endpoints
```
POST   /api/assignments/:id/submissions          - Submit assignment
GET    /api/assignments/:id/submissions          - Get all submissions
GET    /api/assignments/:id/submissions/:sid     - Get specific submission
POST   /api/assignments/:id/submissions/:sid/evaluate        - Evaluate submission
POST   /api/assignments/:id/submissions/evaluate-all         - Bulk evaluate
```

#### Student Level Endpoints
```
GET    /api/student-subject-levels/student/:studentId        - All subjects for student
GET    /api/student-subject-levels/subject/:subjectId        - All students for subject
GET    /api/student-subject-levels/student/:studentId/subject/:subjectId - Specific level
GET    /api/student-subject-levels/student/:studentId/subject/:subjectId/history - Performance history
GET    /api/student-subject-levels/statistics/overview       - Statistics
```

### Frontend Components

#### Admin Components
```
src/app/component/admin/
├── assignments/
│   ├── create-assignment/
│   ├── view-assignments/
│   └── assignment-submissions/
└── statistics/
    └── assignment-analytics/
```

#### Lecturer Components
```
src/app/component/lecturer/
├── create-assignment/
├── view-assignments/
├── assignment-submissions/
└── student-performance/
```

#### Student Components
```
src/app/component/student/
├── view-assignments/
├── submit-assignment/
├── assignment-results/
└── my-progress/
```

---

## API Reference

### Evaluate Assignment

**POST** `/api/assignments/:assignmentId/submissions/:submissionId/evaluate`

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Submission evaluated successfully",
  "data": {
    "_id": "...",
    "marks": 45,
    "percentage": 90,
    "level": "advanced",
    "feedback": "Excellent work...",
    "evaluationStatus": "completed"
  }
}
```

### Get Student Subject Levels

**GET** `/api/student-subject-levels/student/:studentId`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "studentId": {...},
      "subjectId": { "name": "DSA", "code": "DSA201" },
      "averageMarks": 75,
      "averagePercentage": 75,
      "level": "advanced",
      "completedAssignments": 5,
      "totalAssignments": 6
    }
  ]
}
```

### Get Performance History

**GET** `/api/student-subject-levels/student/:studentId/subject/:subjectId/history`

**Response:**
```json
{
  "success": true,
  "data": {
    "currentLevel": "intermediate",
    "averagePercentage": 68.5,
    "performanceHistory": [
      {
        "assignmentId": { "title": "Assignment 1" },
        "marks": 60,
        "percentage": 60,
        "level": "intermediate",
        "submittedAt": "2024-01-01"
      }
    ],
    "levelChanges": [...]
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Submission Not Saving
**Problem:** Student clicks submit but nothing happens
**Solution:**
- Check browser console for errors
- Verify all required fields filled
- Check network connection
- Ensure token is valid

#### 2. AI Evaluation Failing
**Problem:** Evaluation stuck on "evaluating" status
**Solution:**
- Check OpenAI API key validity
- Verify API quota not exceeded
- Check backend logs for errors
- Retry evaluation manually

#### 3. Student Levels Not Updating
**Problem:** Performance tracking not working
**Solution:**
- Verify submission is evaluated (status: completed)
- Check backend logs for level update errors
- Run `updateExistingSubmissions.js` script
- Verify StudentSubjectLevel records in database

#### 4. Duplicate Submissions
**Problem:** Student submits multiple times
**Solution:**
- System prevents duplicates automatically
- Check `submittedAt` field is null before allowing submission
- Frontend should disable submit button after submission

#### 5. Incorrect Average Calculation
**Problem:** Student level shows wrong average
**Solution:**
- Verify all submissions have correct marks
- Check totalMarksObtained and totalMaxMarks fields
- Run verification script: `node verifyStudentLevels.js`
- Re-evaluate if necessary

### Debug Scripts

#### Update Existing Submissions
```bash
cd backend
node updateExistingSubmissions.js
```

#### Verify Student Levels
```bash
cd backend
node verifyStudentLevels.js
```

#### Check Submission Status
```javascript
// In MongoDB
db.assignmentsubmissions.find({ 
  evaluationStatus: "evaluating",
  gradedAt: { $lt: new Date(Date.now() - 3600000) } // Stuck for >1hr
})
```

### Logs to Check

**Backend Console:**
```
✅ Student subject level updated successfully
⚠️ Failed to update student subject level: [error]
🔍 Evaluating submission with AI...
✅ AI evaluation completed
```

**Database Queries:**
```javascript
// Check submissions
db.assignmentsubmissions.find({ studentId: ObjectId("...") })

// Check levels
db.studentsubjectlevels.find({ studentId: ObjectId("...") })

// Check failed evaluations
db.assignmentsubmissions.find({ evaluationStatus: "failed" })
```

---

## Best Practices

### For Admins
1. ✅ Set realistic due dates
2. ✅ Test AI generation before using in production
3. ✅ Review AI-generated questions for accuracy
4. ✅ Monitor evaluation queue regularly
5. ✅ Export data for backup periodically

### For Lecturers
1. ✅ Provide clear rubrics for essay questions
2. ✅ Include keywords for short answer questions
3. ✅ Review AI evaluations before publishing
4. ✅ Give constructive feedback
5. ✅ Track student progress trends

### For Students
1. ✅ Start assignments early
2. ✅ Read questions carefully
3. ✅ Use time management
4. ✅ Review feedback after evaluation
5. ✅ Track your performance progress

---

## Future Enhancements

### Planned Features
- [ ] Peer review functionality
- [ ] Assignment templates library
- [ ] Advanced analytics dashboard
- [ ] Mobile app support
- [ ] Plagiarism detection
- [ ] Video submission support
- [ ] Real-time collaboration
- [ ] Gamification with badges
- [ ] Parent/guardian portal
- [ ] Integration with LMS standards (SCORM)

---

## Summary

The Smart LMS Assignment System provides a complete solution for:
- Creating and managing assignments
- Student submissions with multiple formats
- AI-powered automatic evaluation
- Manual grading capabilities
- Comprehensive performance tracking
- Real-time analytics and reporting

**Status:** ✅ Fully Operational
**Last Updated:** November 2025
**Version:** 2.0

For additional support, see individual component documentation or contact system administrators.
