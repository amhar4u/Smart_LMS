# 🏗️ Admin Technical Guide with System Diagrams

## 📋 Overview

Technical documentation for Smart LMS system architecture, database schemas, data flow diagrams, and Socket.IO event system.

---

## 🗂️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SMART LMS SYSTEM                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   FRONTEND       │         │    BACKEND       │         │    DATABASE      │
│  Angular 18      │◄───────►│   Node.js +      │◄───────►│   MongoDB        │
│  Port: 4200      │  HTTP   │   Express.js     │  ODM    │   smart_lms      │
│  Host: 0.0.0.0   │         │   Port: 3000     │         │   Cloud Atlas    │
└──────────────────┘         └──────────────────┘         └──────────────────┘
        │                             │
        │      Socket.IO              │
        │    (Real-time WS)           │
        └─────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  EXTERNAL APIs   │         │  FILE STORAGE    │         │  VIDEO PLATFORM  │
│  - OpenAI        │         │  Cloudinary      │         │  Daily.co        │
│  - Gemini        │         │  (Images/PDFs)   │         │  (Meetings)      │
└──────────────────┘         └──────────────────┘         └──────────────────┘
```

---

## 🗄️ Database Schema (ER Diagram)

### Entity Relationship Diagram:

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   USERS     │         │ DEPARTMENTS │         │  COURSES    │
├─────────────┤         ├─────────────┤         ├─────────────┤
│ _id         │         │ _id         │         │ _id         │
│ firstName   │         │ code        │         │ code        │
│ lastName    │         │ name        │         │ name        │
│ email       │◄────┐   │ description │◄────────┤ description │
│ password    │     │   │ head        │         │ credits     │
│ role*       │     │   └─────────────┘         │ department  │
│ profilePic  │     │                           │ lecturers[] │
│ createdAt   │     │                           └─────────────┘
└─────────────┘     │                                  │
       │            │                                  │
       │ 1:N        │ 1:N                             │ 1:N
       │            │                                  │
       ▼            │                                  ▼
┌─────────────┐     │                           ┌─────────────┐
│  BATCHES    │     │                           │  SEMESTERS  │
├─────────────┤     │                           ├─────────────┤
│ _id         │     │                           │ _id         │
│ name        │     │                           │ name        │
│ course      │─────┘                           │ academicYear│
│ semester    │◄────────────────────────────────┤ startDate   │
│ students[]  │                                 │ endDate     │
│ subjects[]  │                                 │ status      │
│ startYear   │                                 │ current     │
│ endYear     │                                 └─────────────┘
└─────────────┘
       │
       │ N:N
       │
       ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  SUBJECTS   │         │   MODULES   │         │EXTRAMODULES │
├─────────────┤         ├─────────────┤         ├─────────────┤
│ _id         │─────────►│ _id         │         │ _id         │
│ code        │  1:N    │ moduleNumber│         │ moduleNumber│
│ name        │         │ name        │         │ name        │
│ description │         │ subject     │         │ subject     │
│ credits     │         │ description │         │ description │
│ course      │         │ resources[] │         │ level*      │
│ semester    │         │ objectives  │         │ resources[] │
│ lecturer    │         │ createdAt   │         │ objectives  │
│ batches[]   │         └─────────────┘         └─────────────┘
└─────────────┘
       │
       │ 1:N                                     * Enumerations:
       │                                         role: admin, lecturer, student
       ▼                                         level: 1, 2, 3
┌─────────────┐         ┌─────────────┐         status: active, inactive
│ ASSIGNMENTS │         │ SUBMISSIONS │         submissionStatus: submitted,
├─────────────┤         ├─────────────┤                          graded, late
│ _id         │─────────►│ _id         │
│ title       │  1:N    │ assignment  │
│ description │         │ student     │─────┐
│ subject     │         │ submittedAt │     │
│ dueDate     │         │ files[]     │     │
│ points      │         │ grade       │     │
│ resources[] │         │ feedback    │     │
│ createdBy   │         │ status      │     │
└─────────────┘         │ aiAnalysis  │     │
                        └─────────────┘     │
                                            │ N:1
┌─────────────┐         ┌─────────────┐     │
│  MEETINGS   │         │ ATTENDANCE  │◄────┘
├─────────────┤         ├─────────────┤
│ _id         │─────────►│ _id         │
│ subject     │  1:N    │ meeting     │
│ lecturer    │         │ student     │
│ date        │         │ sessions[]  │
│ duration    │         │ - joinTime  │
│ roomUrl     │         │ - leaveTime │
│ status      │         │ - duration  │
│ participants│         │ totalTime   │
└─────────────┘         │ percentage  │
       │                │ status      │
       │ 1:N            │ lateArrival │
       │                └─────────────┘
       ▼
┌──────────────────┐
│ STUDENTEMOTIONS  │
├──────────────────┤
│ _id              │
│ meeting          │
│ student          │
│ timestamp        │
│ emotions {       │
│   happy          │
│   sad            │
│   angry          │
│   fearful        │
│   disgusted      │
│   surprised      │
│   neutral        │
│ }                │
│ dominantEmotion  │
│ attentiveness    │
│ faceDetected     │
└──────────────────┘

┌──────────────────────┐
│ STUDENTSUBJECTLEVELS │
├──────────────────────┤
│ _id                  │
│ student              │
│ subject              │
│ level (1-3)          │
│ assignmentAvg        │
│ attendanceRate       │
│ engagementScore      │
│ lastUpdated          │
│ updatedBy            │
└──────────────────────┘
```

---

## 📊 Data Flow Diagrams

### 1. Student Meeting Join Flow

```
┌──────────┐                 ┌──────────┐                 ┌──────────┐
│ Student  │                 │ Frontend │                 │ Backend  │
│ Browser  │                 │ Angular  │                 │ Node.js  │
└──────────┘                 └──────────┘                 └──────────┘
     │                             │                             │
     │  1. Click "Join Meeting"    │                             │
     ├────────────────────────────►│                             │
     │                             │                             │
     │  2. Request camera access   │                             │
     │◄────────────────────────────┤                             │
     │                             │                             │
     │  3. Allow camera            │                             │
     ├────────────────────────────►│                             │
     │                             │                             │
     │                             │  4. Connect Socket.IO       │
     │                             ├────────────────────────────►│
     │                             │                             │
     │                             │  5. Emit "join-meeting"     │
     │                             ├────────────────────────────►│
     │                             │     {meetingId, studentId}  │
     │                             │                             │
     │                             │                             │ 6. Create/Update
     │                             │                             │    Attendance
     │                             │                             │    Record
     │                             │                             │
     │                             │  7. Emit "student-joined"   │
     │                             │◄────────────────────────────┤
     │                             │     to lecturer             │
     │                             │                             │
     │                             │  8. Load Face-API models    │
     │                             │  (if first time)            │
     │                             │                             │
     │  9. Initialize webcam       │                             │
     │◄────────────────────────────┤                             │
     │                             │                             │
     │ 10. Start video stream      │                             │
     ├────────────────────────────►│                             │
     │                             │                             │
     │                             │ 11. Start emotion tracking  │
     │                             │     (every 60 seconds)      │
     │                             │                             │
     │ 12. Join Daily.co meeting   │                             │
     │◄────────────────────────────┤                             │
     │                             │                             │
     ▼                             ▼                             ▼
```

### 2. Emotion Tracking Flow

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  Webcam      │         │  Face-API.js │         │  Frontend    │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                        │
       │  1. Video frame        │                        │
       ├───────────────────────►│                        │
       │  (every 60 seconds)    │                        │
       │                        │                        │
       │                        │  2. Detect face        │
       │                        │  3. Extract emotions   │
       │                        │  4. Calculate scores   │
       │                        │                        │
       │                        │  5. Return result      │
       │                        ├───────────────────────►│
       │                        │  {                     │
       │                        │    emotions: {...},    │
       │                        │    dominant: "happy",  │
       │                        │    attentive: 0.85     │
       │                        │  }                     │
       │                        │                        │
       ▼                        ▼                        │
                                                         │
                                                         ▼
                                                  ┌──────────────┐
                                                  │  Socket.IO   │
                                                  └──────────────┘
                                                         │
                                                         │  6. Emit "emotion-update"
                                                         ├────────────────►
                                                         │
                                                  ┌──────────────┐
                                                  │   Backend    │
                                                  └──────────────┘
                                                         │
                                                         │  7. Save to DB
                                                         │     (StudentEmotion)
                                                         │
                                                         │  8. Broadcast to
                                                         │     lecturer
                                                         │     "student-emotion-live"
                                                         │
                                                         │  9. Check alerts
                                                         │     (negative > 60%
                                                         │      OR attentive < 50%)
                                                         │
                                                         │ 10. Emit "emotion-alert"
                                                         │     if threshold exceeded
                                                         │
                                                         ▼
```

### 3. Assignment Submission Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│ Student  │         │ Frontend │         │ Backend  │         │ Database │
└──────────┘         └──────────┘         └──────────┘         └──────────┘
     │                     │                     │                     │
     │  1. Select file     │                     │                     │
     ├────────────────────►│                     │                     │
     │                     │                     │                     │
     │                     │  2. Upload to       │                     │
     │                     │     Cloudinary      │                     │
     │                     ├────────────────────►│                     │
     │                     │                     │                     │
     │                     │  3. Get file URL    │                     │
     │                     │◄────────────────────┤                     │
     │                     │                     │                     │
     │                     │  4. POST /api/      │                     │
     │                     │     submissions     │                     │
     │                     ├────────────────────►│                     │
     │                     │  {                  │                     │
     │                     │    assignmentId,    │                     │
     │                     │    studentId,       │                     │
     │                     │    files: [url]     │                     │
     │                     │  }                  │                     │
     │                     │                     │                     │
     │                     │                     │  5. Create record   │
     │                     │                     ├────────────────────►│
     │                     │                     │     AssignmentSub   │
     │                     │                     │                     │
     │                     │                     │  6. Return _id      │
     │                     │                     │◄────────────────────┤
     │                     │                     │                     │
     │                     │  7. Success response│                     │
     │                     │◄────────────────────┤                     │
     │                     │                     │                     │
     │  8. Show success    │                     │                     │
     │◄────────────────────┤                     │                     │
     │                     │                     │                     │
     │                     │                     │  9. AI Grading      │
     │                     │                     │     (async)         │
     │                     │                     │                     │
     │                     │                     │ 10. Update grade    │
     │                     │                     ├────────────────────►│
     │                     │                     │                     │
     │                     │                     │ 11. Update level    │
     │                     │                     │     (StudentSubject │
     │                     │                     │      Level)         │
     │                     │                     ├────────────────────►│
     │                     │                     │                     │
     ▼                     ▼                     ▼                     ▼
```

### 4. Attendance Calculation Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     ATTENDANCE PROCESSING                         │
└──────────────────────────────────────────────────────────────────┘

Student Joins:
┌─────────────────┐
│ join-meeting    │
│ event received  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐         ┌─────────────────┐
│ Find or Create  │────────►│ Add session:    │
│ Attendance doc  │         │ {               │
└─────────────────┘         │   joinTime: now │
                            │   leaveTime: null│
                            │   duration: 0   │
                            │ }               │
                            └─────────────────┘

Student Leaves:
┌─────────────────┐
│ leave-meeting   │
│ event received  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐         ┌─────────────────┐
│ Find last       │────────►│ Update session: │
│ open session    │         │ leaveTime = now │
└─────────────────┘         │ duration = diff │
         │                  └─────────────────┘
         │
         ▼
┌─────────────────┐         ┌─────────────────┐
│ Calculate       │────────►│ Sum all session │
│ total duration  │         │ durations       │
└─────────────────┘         └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Calculate %:    │
│                 │
│ total_duration  │
│ ─────────────── │
│ meeting_duration│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Set status:     │
│ >75% = Present  │
│ 50-75% = Partial│
│ <50% = Absent   │
└─────────────────┘
```

---

## 🔌 Socket.IO Event System

### Event Architecture:

```
┌───────────────────────────────────────────────────────────────────┐
│                      SOCKET.IO EVENTS                              │
└───────────────────────────────────────────────────────────────────┘

CLIENT (Frontend) EMITS:
┌────────────────────┐
│ join-meeting       │──► Backend creates/updates Attendance
├────────────────────┤    Records join time
│ Data: {            │    Broadcasts to lecturer
│   meetingId,       │
│   studentId,       │
│   studentName      │
│ }                  │
└────────────────────┘

┌────────────────────┐
│ leave-meeting      │──► Backend updates Attendance
├────────────────────┤    Records leave time
│ Data: {            │    Calculates duration
│   meetingId,       │    Broadcasts to lecturer
│   studentId        │
│ }                  │
└────────────────────┘

┌────────────────────┐
│ emotion-update     │──► Backend saves StudentEmotion
├────────────────────┤    Broadcasts to lecturer
│ Data: {            │    Checks alert thresholds
│   meetingId,       │    Emits alert if needed
│   studentId,       │
│   studentName,     │
│   emotions: {...}, │
│   dominant,        │
│   attentiveness    │
│ }                  │
└────────────────────┘


SERVER (Backend) EMITS:
┌────────────────────┐
│ student-joined     │──► To lecturer only
├────────────────────┤    Real-time notification
│ Data: {            │    Update participant list
│   meetingId,       │
│   studentId,       │
│   studentName,     │
│   joinTime         │
│ }                  │
└────────────────────┘

┌────────────────────┐
│ student-left       │──► To lecturer only
├────────────────────┤    Real-time notification
│ Data: {            │    Update participant list
│   meetingId,       │    Show duration attended
│   studentId,       │
│   studentName,     │
│   leaveTime,       │
│   duration         │
│ }                  │
└────────────────────┘

┌─────────────────────┐
│student-emotion-live │──► To lecturer only
├─────────────────────┤    Real-time emotion data
│ Data: {             │    Update dashboard
│   meetingId,        │
│   studentId,        │
│   studentName,      │
│   emotions: {...},  │
│   dominant,         │
│   attentiveness,    │
│   timestamp         │
│ }                   │
└─────────────────────┘

┌────────────────────┐
│ emotion-alert      │──► To lecturer only
├────────────────────┤    Alert notification
│ Data: {            │    High priority
│   meetingId,       │
│   studentId,       │
│   studentName,     │
│   alertType,       │    "negative_emotions" OR
│   severity,        │    "low_attentiveness"
│   details          │
│ }                  │
└────────────────────┘


SOCKET.IO ROOMS:
┌────────────────────┐
│ meeting-{id}       │──► All participants of meeting
└────────────────────┘

┌────────────────────┐
│ lecturer-{id}      │──► Individual lecturer notifications
└────────────────────┘

┌────────────────────┐
│ student-{id}       │──► Individual student notifications
└────────────────────┘
```

---

## 📡 API Endpoint Reference

### Authentication:
```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login and get JWT token
GET    /api/auth/me                Get current user info
PUT    /api/auth/update-profile    Update user profile
```

### Users:
```
GET    /api/users                  Get all users (admin only)
GET    /api/users/:id              Get user by ID
PUT    /api/users/:id              Update user
DELETE /api/users/:id              Delete user (admin only)
GET    /api/users/role/:role       Get users by role
```

### Courses:
```
GET    /api/courses                Get all courses
POST   /api/courses                Create course (admin)
GET    /api/courses/:id            Get course by ID
PUT    /api/courses/:id            Update course
DELETE /api/courses/:id            Delete course (admin)
```

### Subjects:
```
GET    /api/subjects               Get all subjects
POST   /api/subjects               Create subject (lecturer)
GET    /api/subjects/:id           Get subject by ID
PUT    /api/subjects/:id           Update subject
DELETE /api/subjects/:id           Delete subject
GET    /api/subjects/batch/:id     Get subjects for batch
GET    /api/subjects/lecturer/:id  Get lecturer's subjects
```

### Modules:
```
GET    /api/modules/subject/:id    Get modules for subject
POST   /api/modules                Create module
GET    /api/modules/:id            Get module by ID
PUT    /api/modules/:id            Update module
DELETE /api/modules/:id            Delete module
```

### Extra Modules:
```
GET    /api/extra-modules/subject/:id        Get extra modules
POST   /api/extra-modules                    Create extra module
GET    /api/extra-modules/student/:subjectId Get accessible extras
PUT    /api/extra-modules/:id                Update extra module
DELETE /api/extra-modules/:id                Delete extra module
```

### Assignments:
```
GET    /api/assignments/subject/:id           Get subject assignments
POST   /api/assignments                       Create assignment
GET    /api/assignments/:id                   Get assignment by ID
PUT    /api/assignments/:id                   Update assignment
DELETE /api/assignments/:id                   Delete assignment
POST   /api/assignments/submit                Submit assignment
GET    /api/assignments/submissions/:id       Get assignment submissions
PUT    /api/assignments/grade/:submissionId   Grade submission
```

### Meetings:
```
GET    /api/meetings                 Get all meetings
POST   /api/meetings                 Create meeting
GET    /api/meetings/:id             Get meeting by ID
PUT    /api/meetings/:id             Update meeting
DELETE /api/meetings/:id             Delete meeting
GET    /api/meetings/subject/:id     Get subject meetings
GET    /api/meetings/student/:id     Get student's meetings
GET    /api/meetings/active          Get active meetings
```

### Attendance:
```
POST   /api/attendance/join                   Record join
POST   /api/attendance/leave                  Record leave
GET    /api/attendance/meeting/:id            Get meeting attendance
GET    /api/attendance/student/:id            Get student attendance
GET    /api/attendance/report/meeting/:id     Generate meeting report
GET    /api/attendance/report/student/:id     Generate student report
GET    /api/attendance/report/batch/:id       Generate batch report
GET    /api/attendance/export/csv/:meetingId  Export to CSV
GET    /api/attendance/statistics/batch/:id   Batch statistics
GET    /api/attendance/late-arrivals/:id      Get late arrivals
GET    /api/attendance/student/:sid/subject/:subid  Student subject attendance
DELETE /api/attendance/:id                    Delete record (admin)
```

### Emotions:
```
POST   /api/emotions                           Save emotion data
GET    /api/emotions/meeting/:id               Get meeting emotions
GET    /api/emotions/student/:id               Get student emotions
GET    /api/emotions/meeting/:mid/student/:sid Get specific emotions
GET    /api/emotions/summary/:meetingId        Get emotion summary
GET    /api/emotions/timeline/:studentId       Get emotion timeline
GET    /api/emotions/alerts/:meetingId         Get alerts
GET    /api/emotions/engagement/:meetingId     Get current engagement
```

### Student Levels:
```
GET    /api/student-levels/:studentId           Get all student levels
GET    /api/student-levels/:sid/subject/:subid  Get specific level
POST   /api/student-levels/calculate            Calculate and update level
PUT    /api/student-levels/:id                  Manually update level
GET    /api/student-levels/subject/:subjectId   Get all students' levels
```

### Statistics:
```
GET    /api/statistics/dashboard       Overall system stats
GET    /api/statistics/lecturer/:id    Lecturer statistics
GET    /api/statistics/student/:id     Student statistics
GET    /api/statistics/subject/:id     Subject statistics
GET    /api/statistics/batch/:id       Batch statistics
```

---

## 🔐 Authentication Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  Client  │         │ Backend  │         │ Database │
└──────────┘         └──────────┘         └──────────┘
     │                     │                     │
     │  POST /api/auth/    │                     │
     │  login              │                     │
     ├────────────────────►│                     │
     │  {email, password}  │                     │
     │                     │                     │
     │                     │  Find user by email │
     │                     ├────────────────────►│
     │                     │                     │
     │                     │  Return user        │
     │                     │◄────────────────────┤
     │                     │                     │
     │                     │  Compare passwords  │
     │                     │  (bcrypt)           │
     │                     │                     │
     │                     │  Generate JWT token │
     │                     │  (7 days expiry)    │
     │                     │                     │
     │  Return token +     │                     │
     │  user data          │                     │
     │◄────────────────────┤                     │
     │                     │                     │
     │  Store in localStorage                    │
     │  (Frontend)         │                     │
     │                     │                     │
     │  Include in headers:│                     │
     │  Authorization:     │                     │
     │  Bearer {token}     │                     │
     │                     │                     │
     ▼                     ▼                     ▼

Middleware checks token on protected routes:
┌────────────────────────────────────┐
│ auth.js middleware                 │
├────────────────────────────────────┤
│ 1. Extract token from header       │
│ 2. Verify JWT signature            │
│ 3. Decode user ID from token       │
│ 4. Attach user to request object   │
│ 5. Continue to route handler       │
└────────────────────────────────────┘
```

---

## 📂 File Storage Architecture

```
┌────────────────────────────────────────────────────────────┐
│                   FILE STORAGE FLOW                         │
└────────────────────────────────────────────────────────────┘

┌──────────┐         ┌──────────┐         ┌──────────┐
│ Frontend │         │ Backend  │         │Cloudinary│
└──────────┘         └──────────┘         └──────────┘
     │                     │                     │
     │  1. Select file     │                     │
     ├────────────────────►│                     │
     │                     │                     │
     │                     │  2. Upload file     │
     │                     ├────────────────────►│
     │                     │     via SDK         │
     │                     │                     │
     │                     │  3. Return URL:     │
     │                     │  https://res.       │
     │                     │  cloudinary.com/... │
     │                     │◄────────────────────┤
     │                     │                     │
     │  4. Save URL to DB  │                     │
     │     (not file)      │                     │
     │                     │                     │
     ▼                     ▼                     ▼

File Types:
┌─────────────────────┐
│ Profile Pictures    │──► Cloudinary folder: /profile-pics
├─────────────────────┤    Format: jpg, png
│ Assignment Files    │──► Cloudinary folder: /assignments
├─────────────────────┤    Format: pdf, doc, docx
│ Module Resources    │──► Cloudinary folder: /modules
├─────────────────────┤    Format: pdf, ppt, video
│ Submission Files    │──► Cloudinary folder: /submissions
└─────────────────────┘    Format: pdf, zip

Storage in Database:
┌─────────────────────┐
│ User.profilePic     │──► "https://res.cloudinary.com/..."
├─────────────────────┤
│ Module.resources[]  │──► Array of URLs
├─────────────────────┤
│ Submission.files[]  │──► Array of file URLs
└─────────────────────┘
```

---

## 🎥 Meeting Platform Integration

```
┌────────────────────────────────────────────────────────────┐
│                  DAILY.CO INTEGRATION                       │
└────────────────────────────────────────────────────────────┘

Create Meeting:
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  Lecturer    │         │   Backend    │         │   Daily.co   │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                        │
       │  Create meeting        │                        │
       ├───────────────────────►│                        │
       │                        │                        │
       │                        │  POST /rooms           │
       │                        ├───────────────────────►│
       │                        │  {                     │
       │                        │    privacy: "public",  │
       │                        │    properties: {...}   │
       │                        │  }                     │
       │                        │                        │
       │                        │  Return room URL       │
       │                        │◄───────────────────────┤
       │                        │                        │
       │  Save meeting with     │                        │
       │  roomUrl in DB         │                        │
       │◄───────────────────────┤                        │
       │                        │                        │
       ▼                        ▼                        ▼

Join Meeting:
┌──────────────┐         ┌──────────────┐
│   Student    │         │   Frontend   │
└──────────────┘         └──────────────┘
       │                        │
       │  Click Join            │
       ├───────────────────────►│
       │                        │
       │                        │  Initialize Daily
       │                        │  iframe/component
       │                        │
       │  Load Daily.co room    │
       │◄───────────────────────┤
       │  (iframe embedded)     │
       │                        │
       │  Join with camera on   │
       │                        │
       ▼                        ▼

Features Used:
- Video conferencing
- Screen sharing
- Chat
- Recording (optional)
- Participant management
```

---

## 🧠 AI Grading System

```
┌────────────────────────────────────────────────────────────┐
│               AI GRADING ARCHITECTURE                       │
└────────────────────────────────────────────────────────────┘

Submission → AI Analysis → Grading

┌──────────────────┐
│ Assignment       │
│ Submission       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐         ┌──────────────────┐
│ Extract text     │────────►│ Send to AI API   │
│ from PDF         │         │ (OpenAI/Gemini)  │
└──────────────────┘         └────────┬─────────┘
                                      │
                                      ▼
┌──────────────────┐         ┌──────────────────┐
│ AI analyzes:     │◄────────│ AI Response:     │
│ - Content        │         │ - Score (0-100)  │
│ - Relevance      │         │ - Strengths      │
│ - Completeness   │         │ - Improvements   │
│ - Structure      │         │ - Suggestions    │
└────────┬─────────┘         └──────────────────┘
         │
         ▼
┌──────────────────┐
│ Point-based      │
│ Grading:         │
│                  │
│ Category Points: │
│ - Content: 40    │
│ - Structure: 20  │
│ - Originality:25 │
│ - Grammar: 15    │
│                  │
│ Total: /100      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐         ┌──────────────────┐
│ Save to DB:      │────────►│ Update Student   │
│ - grade          │         │ Level based on   │
│ - feedback       │         │ assignment avg   │
│ - aiAnalysis     │         └──────────────────┘
└──────────────────┘
```

---

## 🔄 Student Level Calculation

```
┌────────────────────────────────────────────────────────────┐
│             STUDENT LEVEL CALCULATION                       │
└────────────────────────────────────────────────────────────┘

Triggered by:
- New assignment grade
- Meeting attendance update
- Emotion tracking data

┌──────────────────┐
│ Calculate Level  │
│ for Student in   │
│ Subject          │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐         ┌──────────────────┐
│ Get Assignment   │         │ Get Attendance   │
│ Average          │         │ Percentage       │
│                  │         │                  │
│ assignmentAvg =  │         │ attendanceRate = │
│ SUM(grades)/     │         │ attended/        │
│ COUNT(grades)    │         │ total_meetings   │
└────────┬─────────┘         └────────┬─────────┘
         │                            │
         └──────────┬─────────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │ Get Engagement   │
         │ Score            │
         │                  │
         │ engagementScore =│
         │ AVG(attentiveness│
         │ from emotions)   │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Calculate Total: │
         │                  │
         │ score =          │
         │ (assignmentAvg   │
         │  × 0.6) +        │
         │ (attendanceRate  │
         │  × 0.25) +       │
         │ (engagement      │
         │  × 0.15)         │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Determine Level: │
         │                  │
         │ score >= 80      │
         │   → Level 3      │
         │ score >= 60      │
         │   → Level 2      │
         │ else             │
         │   → Level 1      │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Update           │
         │ StudentSubject   │
         │ Level in DB      │
         └──────────────────┘
```

---

## 🌐 Network Configuration

```
┌────────────────────────────────────────────────────────────┐
│                NETWORK ARCHITECTURE                         │
└────────────────────────────────────────────────────────────┘

Development:
┌─────────────────────────────────────────────────────┐
│  Backend Server                                     │
│  Host: 0.0.0.0                                      │
│  Port: 3000                                         │
│  Access:                                            │
│  - http://localhost:3000                            │
│  - http://192.168.8.168:3000 (LAN)                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Frontend Server                                    │
│  Host: 0.0.0.0                                      │
│  Port: 4200                                         │
│  Access:                                            │
│  - http://localhost:4200                            │
│  - http://192.168.8.168:4200 (LAN)                  │
└─────────────────────────────────────────────────────┘

CORS Configuration:
┌─────────────────────────────────────────────────────┐
│  Allowed Origins:                                   │
│  - http://localhost:4200                            │
│  - http://192.168.8.168:4200                        │
│                                                     │
│  Methods: GET, POST, PUT, DELETE, OPTIONS           │
│  Headers: Content-Type, Authorization              │
│  Credentials: true                                  │
└─────────────────────────────────────────────────────┘

Socket.IO:
┌─────────────────────────────────────────────────────┐
│  Connection:                                        │
│  URL: http://192.168.8.168:3000                     │
│  Transport: WebSocket, Polling                      │
│  CORS: Same as HTTP                                 │
└─────────────────────────────────────────────────────┘

Camera/Microphone Access:
┌─────────────────────────────────────────────────────┐
│  Localhost: ✅ Works (HTTP allowed)                 │
│  IP Address: ⚠️ Requires HTTPS for camera           │
│                                                     │
│  Solution for IP Access:                            │
│  1. Generate SSL certificate (cert.pem, key.pem)    │
│  2. Configure Angular for HTTPS                     │
│  3. Access via https://192.168.8.168:4200           │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

```
┌────────────────────────────────────────────────────────────┐
│                  TECHNOLOGY STACK                           │
└────────────────────────────────────────────────────────────┘

Frontend:
┌─────────────────────────────────────────────────────┐
│ Framework:       Angular 18                         │
│ Language:        TypeScript 5.x                     │
│ UI Library:      Angular Material                   │
│ State:           Services (Singleton pattern)       │
│ HTTP:            HttpClient                         │
│ WebSocket:       Socket.IO Client                   │
│ Video:           Daily.co SDK                       │
│ ML:              Face-API.js (TensorFlow.js)        │
│ Forms:           Reactive Forms                     │
│ Routing:         Angular Router                     │
│ Build:           Angular CLI, esbuild               │
└─────────────────────────────────────────────────────┘

Backend:
┌─────────────────────────────────────────────────────┐
│ Runtime:         Node.js 18+                        │
│ Framework:       Express.js 4.x                     │
│ Language:        JavaScript (ES6+)                  │
│ Database:        MongoDB Atlas (Cloud)              │
│ ODM:             Mongoose 7.x                       │
│ Auth:            JWT (jsonwebtoken)                 │
│ Password:        bcryptjs                           │
│ WebSocket:       Socket.IO 4.x                      │
│ File Upload:     Multer, Cloudinary                 │
│ AI:              OpenAI API, Google Gemini          │
│ Video:           Daily.co REST API                  │
│ Validation:      Express-validator                  │
└─────────────────────────────────────────────────────┘

Database:
┌─────────────────────────────────────────────────────┐
│ Type:            NoSQL (Document-based)             │
│ Provider:        MongoDB Atlas                      │
│ Database:        smart_lms                          │
│ Collections:     14 collections                     │
│ Indexes:         Compound indexes on frequently     │
│                  queried fields                     │
│ Backup:          Automated daily backups            │
└─────────────────────────────────────────────────────┘

External Services:
┌─────────────────────────────────────────────────────┐
│ File Storage:    Cloudinary                         │
│ Video Platform:  Daily.co                           │
│ AI Grading:      OpenAI GPT-4 / Google Gemini       │
│ Email:           (Future: SendGrid/Nodemailer)      │
└─────────────────────────────────────────────────────┘

Development Tools:
┌─────────────────────────────────────────────────────┐
│ Package Manager: npm                                │
│ Version Control: Git                                │
│ IDE:             VS Code                            │
│ API Testing:     Postman/Thunder Client             │
│ Debugging:       Chrome DevTools, Node Inspector    │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Database Indexes

### Performance Optimization:

```javascript
// User Collection
users.createIndex({ email: 1 }, { unique: true })
users.createIndex({ role: 1 })

// Subjects Collection
subjects.createIndex({ course: 1 })
subjects.createIndex({ lecturer: 1 })
subjects.createIndex({ semester: 1 })

// Assignments Collection
assignments.createIndex({ subject: 1 })
assignments.createIndex({ createdBy: 1 })
assignments.createIndex({ dueDate: 1 })

// Submissions Collection
submissions.createIndex({ assignment: 1, student: 1 })
submissions.createIndex({ student: 1 })
submissions.createIndex({ submittedAt: -1 })

// Meetings Collection
meetings.createIndex({ subject: 1 })
meetings.createIndex({ lecturer: 1 })
meetings.createIndex({ date: -1 })
meetings.createIndex({ status: 1 })

// Attendance Collection
attendance.createIndex({ meeting: 1, student: 1 }, { unique: true })
attendance.createIndex({ meeting: 1 })
attendance.createIndex({ student: 1 })

// StudentEmotions Collection
studentemotions.createIndex({ meeting: 1, student: 1, timestamp: -1 })
studentemotions.createIndex({ meeting: 1, timestamp: -1 })
studentemotions.createIndex({ student: 1, timestamp: -1 })

// StudentSubjectLevels Collection
studentsubjectlevels.createIndex({ student: 1, subject: 1 }, { unique: true })
studentsubjectlevels.createIndex({ subject: 1 })
studentsubjectlevels.createIndex({ level: 1 })
```

---

## 🔍 Monitoring & Debugging

### Backend Console Output:

```
✅ Server ready to track emotions!
🎯 Start your 5-minute video test now
📡 Socket.IO Events Available:
   - emotion-update: Save & broadcast emotions
   - join-meeting: Record attendance join
   - leave-meeting: Record attendance leave
✅ ENABLED FEATURES:
   🔌 Socket.IO - Real-time communication
   🎭 Emotion Tracking - Face detection & analysis
   📝 Attendance Tracking - Join/leave monitoring
   📊 Per-minute statistics - Emotion aggregation
   🚨 Alert Detection - Negative emotions & low attention

✅ Connected to MongoDB
📦 Database: smart_lms
🌐 Server running on http://0.0.0.0:3000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 EMOTION UPDATE RECEIVED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Timestamp: 2025-11-16T10:30:45.123Z
👤 Student: John Doe (student_id_123)
🎯 Meeting: meeting_id_456

😊 EMOTION BREAKDOWN:
   Happy:      0.75 (75%)
   Sad:        0.05 (5%)
   Angry:      0.02 (2%)
   Surprised:  0.10 (10%)
   Fearful:    0.03 (3%)
   Disgusted:  0.01 (1%)
   Neutral:    0.04 (4%)

🏆 Dominant Emotion: happy
📊 Attentiveness Level: 0.85 (85%)
👁️ Face Detected: ✅ Yes

✅ Saved to database
📡 Broadcasted to lecturer
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Per-Minute Summary:
📊 Emotions tracked this minute: 12
👥 Unique students: 8
😊 Average happiness: 0.68
📈 Average attentiveness: 0.72
```

### Frontend Console Output:

```
[EmotionTracking] Initializing emotion tracking...
[EmotionTracking] Loading Face-API models...
[EmotionTracking] Models loaded successfully
[EmotionTracking] Starting webcam...
[EmotionTracking] Webcam started
[EmotionTracking] Face detected!
[EmotionTracking] Emotions: {happy: 0.75, sad: 0.05, ...}
[EmotionTracking] Sending emotion update via Socket.IO
[Socket] emotion-update emitted
```

---

## 🚀 Deployment Architecture

### Production Recommendations:

```
┌────────────────────────────────────────────────────────────┐
│                 PRODUCTION DEPLOYMENT                       │
└────────────────────────────────────────────────────────────┘

Frontend:
┌─────────────────────────────────────────────────────┐
│ Build:           ng build --configuration production│
│ Hosting:         Vercel / Netlify / AWS S3          │
│ CDN:             CloudFront / Cloudflare             │
│ HTTPS:           Required (for camera access)        │
│ Environment:     production                         │
└─────────────────────────────────────────────────────┘

Backend:
┌─────────────────────────────────────────────────────┐
│ Hosting:         AWS EC2 / Heroku / DigitalOcean    │
│ Process Mgr:     PM2 (for Node.js)                  │
│ Reverse Proxy:   Nginx                              │
│ HTTPS:           Let's Encrypt SSL                  │
│ Environment:     production                         │
│ Logging:         Winston / Morgan                   │
└─────────────────────────────────────────────────────┘

Database:
┌─────────────────────────────────────────────────────┐
│ Provider:        MongoDB Atlas (M10+ cluster)       │
│ Backup:          Automated daily backups            │
│ Monitoring:      Atlas monitoring tools             │
│ Security:        IP whitelist, strong passwords     │
└─────────────────────────────────────────────────────┘

Recommended Stack:
Frontend → Vercel (with CDN)
Backend  → AWS EC2 (with PM2 + Nginx)
Database → MongoDB Atlas (M10)
Files    → Cloudinary
Video    → Daily.co
```

---

**For Implementation Details:** See EMOTION_TRACKING_GUIDE.md and ATTENDANCE_TRACKING_GUIDE.md

**Last Updated:** November 16, 2025
