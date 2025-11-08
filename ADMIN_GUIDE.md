# 👨‍💼 Smart LMS - Admin Guide

**Complete Administrator Reference Manual**

Version 1.0.0 | Last Updated: November 8, 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Setup](#system-setup)
3. [User Management](#user-management)
4. [Academic Structure Management](#academic-structure-management)
5. [Content Management](#content-management)
6. [Assignment Management](#assignment-management)
7. [Meeting Management](#meeting-management)
8. [System Configuration](#system-configuration)
9. [Security & Access Control](#security--access-control)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

### What is Smart LMS?

Smart LMS is an advanced e-learning management system designed to enhance online education through:
- **Real-time emotion detection** during video classes
- **AI-powered assignment generation** using OpenAI
- **Video conferencing** via Daily.co integration
- **Comprehensive learning materials** management
- **Student engagement monitoring**

### Administrator Role

As an administrator, you have complete control over:
- ✅ User management (students, lecturers, other admins)
- ✅ Academic structure (departments, courses, batches, semesters, subjects)
- ✅ Learning content (modules, extra modules, documents, videos)
- ✅ Assessment management (assignments with AI-generated questions)
- ✅ Video meeting management and scheduling
- ✅ System configuration and security settings

---

## 🚀 System Setup

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Angular 17+ (Standalone Components) |
| Backend | Node.js + Express |
| Database | MongoDB |
| Authentication | Firebase Auth + JWT |
| File Storage | Cloudinary |
| AI Service | OpenAI GPT-4 |
| Video Platform | Daily.co |
| UI Framework | Angular Material |

### Initial Setup

#### 1. Environment Configuration

**Backend (.env):**
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/smart_lms
JWT_SECRET=your_secure_jwt_secret
FIREBASE_PROJECT_ID=your_firebase_project_id
OPENAI_API_KEY=your_openai_api_key
DAILY_API_KEY=your_daily_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Frontend (environment.ts):**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  firebase: {
    apiKey: 'your_firebase_api_key',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your_firebase_project_id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: 'your_sender_id',
    appId: 'your_app_id'
  }
};
```

#### 2. Installation

```bash
# Clone repository
git clone <repository-url>
cd Smart_LMS

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

#### 3. Database Seeding

```bash
cd backend
npm run seed
```

**Default Admin Account:**
- Email: admin@smartlms.com
- Password: Admin@123

---

## 👥 User Management

### Managing Admins

**Path:** Admin Dashboard → Manage Admins

#### Create New Admin
1. Click **"Create Admin"** button
2. Fill in the form:
   - First Name
   - Last Name
   - Email
   - Password (min 8 characters)
   - Confirm Password
3. Click **"Create Admin"**

#### Edit Admin
1. Find admin in table
2. Click **Edit** icon
3. Update information
4. Click **"Update Admin"**

#### Delete Admin
1. Click **Delete** icon
2. Confirm deletion in dialog
3. Admin is permanently removed

**Note:** Cannot delete yourself while logged in.

---

### Managing Students

**Path:** Admin Dashboard → Manage Students

#### Create New Student
1. Click **"Create Student"** button
2. Fill in registration form:
   - **Personal Info**: First name, last name, email, password
   - **Academic Info**: Department, course, batch, semester
   - **Contact Info**: Phone, address (optional)
3. Click **"Register Student"**

#### Bulk Import Students
1. Click **"Import Students"** button
2. Download CSV template
3. Fill template with student data
4. Upload CSV file
5. Review import results

#### Edit Student
1. Search/filter to find student
2. Click **Edit** icon
3. Update student information
4. Change department/course/batch/semester if needed
5. Click **"Update Student"**

#### View Student Details
1. Click student name or **View** icon
2. See complete profile:
   - Academic information
   - Enrolled courses
   - Assignment submissions
   - Attendance records
   - Performance metrics

#### Delete Student
1. Click **Delete** icon
2. Confirm deletion
3. Student data archived (not permanently deleted)

**Filters:**
- Department
- Course  
- Batch
- Semester
- Status (Active/Inactive)
- Search by name or email

---

### Managing Lecturers

**Path:** Admin Dashboard → Manage Lecturers

#### Create New Lecturer
1. Click **"Create Lecturer"** button
2. Fill in the form:
   - Personal info (name, email, password)
   - Department
   - Specialization/subject area
   - Qualifications
   - Contact information
3. Click **"Create Lecturer"**

#### Assign Subjects
1. Edit lecturer details
2. Navigate to **"Assigned Subjects"** section
3. Select subjects from available list
4. Click **"Assign"**

#### View Lecturer Performance
- Number of subjects taught
- Total students
- Meetings conducted
- Assignment statistics
- Student feedback ratings

#### Delete Lecturer
- Only possible if lecturer has no active subjects
- Assignments and meetings are transferred or archived

---

## 🏫 Academic Structure Management

### Departments

**Path:** Admin Dashboard → Manage Departments

#### Create Department
1. Click **"Create Department"**
2. Enter:
   - Department Name (e.g., "Computer Science")
   - Department Code (e.g., "CSE")
   - Description
   - Head of Department (optional)
3. Click **"Save"**

#### Department Hierarchy
```
Department
├── Courses (multiple)
│   ├── Batches (multiple)
│   │   ├── Semesters (multiple)
│   │   │   └── Subjects (multiple)
```

---

### Courses

**Path:** Admin Dashboard → Manage Courses

#### Create Course
1. Select Department
2. Click **"Create Course"**
3. Fill in:
   - Course Name (e.g., "Bachelor of Computer Science")
   - Course Code (e.g., "BCS")
   - Duration (in semesters/years)
   - Description
   - Credit requirements
4. Click **"Save"**

#### Course Features:
- Associate with department
- Define total duration
- Set credit hour requirements
- Link to multiple batches

---

### Batches

**Path:** Admin Dashboard → Manage Batches

#### Create Batch
1. Select Department and Course
2. Click **"Create Batch"**
3. Enter:
   - Batch Name (e.g., "Batch 2024")
   - Year/Session
   - Maximum Students (capacity)
   - Start Date
   - End Date
4. Click **"Save"**

#### Batch Management:
- Assign students to batch
- View batch roster
- Track batch performance
- Generate batch reports

**Example Batch Configuration:**
```
Batch: 2024-A
Department: Computer Science
Course: Bachelor of CS
Capacity: 60 students
Duration: 2024-2028
```

---

### Semesters

**Path:** Admin Dashboard → Manage Semesters

#### Create Semester
1. Select Department, Course, and Batch
2. Click **"Create Semester"**
3. Fill in:
   - Semester Name (e.g., "Semester 1")
   - Semester Number (1-8)
   - Start Date
   - End Date
   - Credits offered
4. Click **"Save"**

#### Semester Features:
- Define date ranges
- Associate multiple subjects
- Track completion status
- Generate semester reports

---

### Subjects

**Path:** Admin Dashboard → Manage Subjects

#### Create Subject
1. Click **"Create Subject"**
2. Fill in details:
   - Subject Name (e.g., "Data Structures")
   - Subject Code (e.g., "DSA-101")
   - Description
   - Department
   - Course
   - Semester
   - Credits
   - Lecturer Assignment
3. Click **"Save"**

#### Subject Configuration:
- **Prerequisites**: Define required prior subjects
- **Corequisites**: Subjects to be taken together
- **Credit Hours**: Theory + Practical
- **Assessment Weightage**: Assignments, exams, attendance

#### Assign Lecturer:
1. Edit subject
2. Select lecturer from dropdown
3. Lecturer can now manage this subject's:
   - Modules
   - Extra modules
   - Assignments
   - Meetings

---

## 📚 Content Management

### Modules (Core Learning Materials)

**Path:** Admin Dashboard → Manage Modules

#### Create Module
1. Click **"Create Module"**
2. Fill in form:
   - **Title**: Module title
   - **Name**: Display name
   - **Code**: Unique identifier (e.g., "MOD-DSA-001")
   - **Description**: Module overview
   - **Subject**: Link to subject
   - **Order**: Display sequence number
3. Upload files:
   - **Documents**: PDF, Word, Excel, PPT (multiple files)
   - **Video**: MP4, AVI, MOV (single video)
4. Click **"Create Module"**

#### File Upload (Cloudinary Integration):
- **Supported Document Formats**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- **Supported Video Formats**: MP4, AVI, MOV, WMV
- **Maximum File Size**: 100MB per file
- **Video Duration Limit**: 2 hours
- **Storage**: Automatic upload to Cloudinary

#### Module Features:
- **Documents List**: Display all uploaded documents
- **Video Player**: Embedded video with controls
- **Download Options**: Students can download documents
- **Progress Tracking**: Track student viewing/completion
- **Active/Inactive Toggle**: Control visibility

#### Edit Module:
1. Click **Edit** icon
2. Update any field
3. Add/remove documents
4. Replace video
5. Change order number
6. Click **"Update Module"**

#### Delete Module:
1. Click **Delete** icon
2. Confirm deletion
3. **Warning**: All documents and videos are permanently removed from Cloudinary

---

### Extra Modules (Supplementary Content)

**Path:** Admin Dashboard → Manage Extra Modules

#### Create Extra Module
1. Click **"Create Extra Module"**
2. Fill in form (same as regular module):
   - Title, Name, Code, Description
   - Subject linkage
   - **Student Level**: Beginner | Intermediate | Advanced | All
   - Order number
3. Upload documents and video
4. Click **"Create Extra Module"**

#### Student Level Classification:
- **Beginner**: Foundation concepts, no prerequisites
- **Intermediate**: Requires basic knowledge
- **Advanced**: For students with solid foundation
- **All**: Suitable for all levels

#### Difference from Regular Modules:
| Feature | Modules | Extra Modules |
|---------|---------|---------------|
| Purpose | Core curriculum | Supplementary |
| Required | Yes | Optional |
| Level Classification | No | Yes |
| Credits | Count towards grade | No credits |
| Availability | Only for enrolled students | All students |

---

## 📝 Assignment Management

**Path:** Admin Dashboard → Manage Assignments

### AI-Powered Assignment Creation

#### Step 1: Basic Information
1. Click **"Create Assignment"**
2. Fill in:
   - **Title**: Assignment name
   - **Description**: Assignment objectives
   - **Department**: Select department
   - **Course**: Select course
   - **Batch**: Select batch
   - **Semester**: Select semester
   - **Subject**: Select subject
   - **Modules**: Select relevant modules (multiple)

#### Step 2: Configuration
- **Assignment Type**:
  - Multiple Choice Questions (MCQ)
  - Short Answer
  - Essay

- **Difficulty Level**:
  - Easy
  - Medium
  - Hard

- **Question Settings**:
  - Number of Questions (1-100)
  - Marks per Question (or total marks)
  - Auto-calculated Total Marks

- **Submission Settings**:
  - Due Date & Time
  - Submission Type: Online / File Upload / Both
  - Time Limit (optional)
  - Allow Late Submission: Yes/No
  - Late Penalty Percentage (if yes)

- **Instructions**:
  - Custom instructions for students
  - Grading rubric
  - Reference materials

#### Step 3: AI Question Generation

**Option A: Generate from Modules**
1. Select radio: "Generate from Module Names"
2. Selected modules are used as content source
3. Click **"Preview Questions"**

**Option B: Custom Content**
1. Select radio: "Provide Custom Content"
2. Paste/type content in text area
3. Click **"Preview Questions"**

**AI Generation Process:**
```
User Input → OpenAI GPT-4 → Generated Questions → Preview → Save
```

**Question Preview:**
- Shows all generated questions
- Displays answer key
- Shows marks allocation
- Allows regeneration if not satisfied

#### Step 4: Save Assignment
1. Review all details in tabs:
   - Tab 1: Assignment Details
   - Tab 2: Questions Preview
2. Click **"Save Assignment"**
3. Assignment created and visible to students

### Assignment Features

#### Assignment Table Columns:
- Title (with description preview)
- Subject
- Batch
- Semester
- Type (MCQ/Short Answer/Essay)
- Level (Easy/Medium/Hard)
- Due Date
- Question Count & Total Marks
- Status (Active/Inactive)
- Actions (Edit/Delete/Toggle Status)

#### Filters:
- Department
- Course
- Type
- Level
- Status
- Search by title

#### Edit Assignment:
1. Click **Edit** icon
2. All fields pre-populated
3. Can regenerate questions
4. Update and save

#### Toggle Status:
- Click toggle switch
- Active: Visible to students
- Inactive: Hidden from students

#### Delete Assignment:
- Click **Delete** icon
- Confirm deletion
- Permanently removed
- **Warning**: Student submissions are also deleted

---

## 🎥 Meeting Management

**Path:** Admin Dashboard → Manage Meetings

### Daily.co Integration

Smart LMS uses **Daily.co** for video conferencing, providing:
- HD video/audio quality
- Screen sharing
- Chat functionality
- Recording capabilities
- Up to 100 participants

### Create Meeting

#### Step 1: Basic Information
1. Click **"Create Meeting"**
2. Fill in dialog:
   - **Topic**: Meeting title
   - **Description**: Meeting agenda/objectives

#### Step 2: Academic Association
- **Department**: Select department
- **Course**: Select course
- **Batch**: Select batch
- **Semester**: Select semester
- **Subject**: Select subject
- **Modules**: Select modules to be covered

#### Step 3: Scheduling
- **Meeting Date**: Select date from calendar
- **Start Time**: HH:MM format
- **Duration (minutes)**: 1-480 minutes (8 hours max)
- **End Time**: Auto-calculated and displayed

#### Step 4: Review & Create
- Review all details
- System automatically:
  - Creates Daily.co room
  - Generates unique room URL
  - Sets room expiry (4 hours after end time)
  - Configures room settings (screen share, chat enabled)
- Click **"Create Meeting"**

### Meeting Lifecycle

```
Created (Scheduled) → Ongoing (Started) → Completed (Ended)
```

#### Meeting Statuses:
- **Scheduled**: Future meeting, can be edited
- **Ongoing**: Currently active
- **Completed**: Finished with attendance recorded
- **Cancelled**: Deleted meeting

### Managing Meetings

#### Meeting Table:
- Topic with description
- Subject
- Batch
- Date & Time
- Duration
- Status (color-coded badge)
- Student Count
- Actions

#### Edit Meeting:
- Only scheduled meetings can be edited
- Click **Edit** icon
- Update any field except start time if within 15 minutes
- Click **"Update Meeting"**

#### Reschedule Meeting:
1. Click **Reschedule** icon
2. Enter new date/time
3. System updates and notifies students

#### Cancel/Delete Meeting:
1. Cannot delete ongoing meetings
2. Click **Delete** icon
3. Confirm cancellation
4. Meeting status set to "cancelled"

#### Start Meeting:
1. Meeting can be started 15 minutes before scheduled time
2. Click **"Start/Host Meeting"**
3. Opens Daily.co room in new window
4. Host has additional controls:
   - Admit/remove participants
   - Mute all
   - End meeting for all
   - Start/stop recording

### Meeting Features

#### For Lecturers:
- Screen sharing
- Whiteboard
- File sharing
- Chat moderation
- Participant management
- Meeting recording

#### For Students:
- Join meeting via link
- Video/audio controls
- Screen sharing (if allowed)
- Chat participation
- Raise hand feature

#### Post-Meeting:
- Automatic attendance marking
- Recording available (if recorded)
- Chat transcript saved
- Meeting analytics:
  - Duration
  - Attendance count
  - Participation metrics

---

## ⚙️ System Configuration

### Cloudinary Setup

**Purpose**: Cloud-based file storage for documents and videos

#### Configuration Steps:
1. Create Cloudinary account at cloudinary.com
2. Get credentials:
   - Cloud Name
   - API Key
   - API Secret
3. Add to backend `.env` file
4. Test upload functionality

**Storage Structure:**
```
smart-lms/
├── modules/
│   ├── documents/
│   └── videos/
├── extra-modules/
│   ├── documents/
│   └── videos/
└── assignments/
    └── submissions/
```

---

### Firebase Authentication

**Purpose**: Secure user authentication and authorization

#### Setup Steps:
1. Create Firebase project
2. Enable Authentication methods:
   - Email/Password
   - Google Sign-In (optional)
3. Generate service account key
4. Save as `backend/config/serviceAccountKey.json`
5. Update environment variables

**Security Rules:**
```javascript
// Firebase Authentication rules
- Only admins can create users
- Users can only update their own profile
- Password reset via email
- Session timeout: 24 hours
```

---

### OpenAI Integration

**Purpose**: AI-powered question generation for assignments

#### Configuration:
1. Get OpenAI API key from platform.openai.com
2. Add to `.env`: `OPENAI_API_KEY=sk-...`
3. Configure model: GPT-4 recommended

**API Usage:**
- Model: gpt-4
- Temperature: 0.7 (balanced creativity)
- Max Tokens: 2000
- Response Format: JSON structured

**Prompt Engineering:**
```
Generate [number] [type] questions about [topic]
Difficulty: [level]
Format: JSON with question, options, answer, explanation
```

**Cost Management:**
- Cache frequently used content
- Implement rate limiting
- Monitor API usage
- Set spending limits

---

### Daily.co Configuration

**Purpose**: Video conferencing platform

#### Setup:
1. Create account at daily.co
2. Get API key
3. Add to `.env`: `DAILY_API_KEY=...`
4. Configure room defaults:
   - Enable screen share: Yes
   - Enable chat: Yes
   - Enable recording: Yes (for admin)
   - Max participants: 100

**Room Settings:**
```javascript
{
  privacy: 'public',
  properties: {
    enable_screenshare: true,
    enable_chat: true,
    exp: timestamp, // 4 hours after meeting end
    max_participants: 100
  }
}
```

---

## 🔒 Security & Access Control

### Role-Based Access Control (RBAC)

#### User Roles:
1. **Admin** (Full Access)
   - All CRUD operations
   - User management
   - System configuration
   - Analytics and reports

2. **Lecturer** (Subject-Specific)
   - Manage own subjects
   - Create/edit modules, assignments, meetings
   - Grade submissions
   - View subject analytics

3. **Student** (Read + Submit)
   - View modules and content
   - Submit assignments
   - Join meetings
   - View grades

### Route Guards

**Frontend Protection:**
```typescript
// Admin routes
canActivate: [adminGuard]

// Lecturer routes
canActivate: [teacherGuard]

// Student routes
canActivate: [studentGuard]

// Unauthenticated only
canActivate: [preventAuthGuard]
```

**Backend Middleware:**
```javascript
// Verify JWT token
auth middleware

// Check admin role
adminAuth middleware

// Check lecturer role
lecturerAuth middleware

// Check student role
studentAuth middleware
```

### Data Security

#### Password Security:
- Minimum 8 characters
- Bcrypt hashing (10 rounds)
- Salted before storage
- Never stored in plain text

#### Token Management:
- JWT expiry: 24 hours
- Refresh token: 7 days
- Secure HTTP-only cookies
- CSRF protection

#### File Upload Security:
- File type validation
- File size limits
- Malware scanning
- Cloudinary automatic moderation

#### API Security:
- Rate limiting: 100 requests/15 minutes
- CORS configuration
- Input validation
- SQL injection prevention (MongoDB)
- XSS protection

### MongoDB Security

**Connection:**
```javascript
// Use environment variable
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
```

**Access Control:**
- Admin user with minimal privileges
- Separate databases for dev/prod
- Backup schedule: Daily at midnight
- Retention: 30 days

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Cannot Login
**Symptoms**: Login fails with "Invalid credentials"

**Solutions:**
- Verify email and password
- Check if account is active
- Clear browser cache/cookies
- Try password reset
- Check Firebase Authentication console

---

#### 2. File Upload Fails
**Symptoms**: Upload progress stuck or error message

**Solutions:**
- Check file size (max 100MB)
- Verify file format is supported
- Check Cloudinary quota/limits
- Verify API credentials in `.env`
- Check network connection
- Try smaller file size

---

#### 3. AI Question Generation Not Working
**Symptoms**: "Preview Questions" button loads indefinitely

**Solutions:**
- Verify OpenAI API key is valid
- Check OpenAI account credit balance
- Review API usage limits
- Check backend console for errors
- Try with less questions
- Verify content is not empty

---

#### 4. Video Meeting Not Loading
**Symptoms**: Daily.co room doesn't open or shows error

**Solutions:**
- Check Daily.co API key
- Verify meeting is scheduled
- Check meeting start time (must be within 15 min)
- Allow browser camera/microphone permissions
- Disable browser extensions
- Try different browser
- Check internet connection

---

#### 5. Students Not Seeing Content
**Symptoms**: Modules/assignments not visible to students

**Solutions:**
- Check if content is marked as "Active"
- Verify student is enrolled in correct batch/semester
- Check subject assignment
- Verify student account is active
- Clear browser cache
- Check API endpoint permissions

---

### Database Issues

#### MongoDB Connection Failed:
```bash
# Check MongoDB service
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017/smart_lms
```

#### Data Seeding Errors:
```bash
# Clear database
npm run clean

# Re-seed data
npm run seed

# Verify seed data
mongo smart_lms
> db.users.find()
> db.departments.find()
```

---

### Performance Optimization

#### Slow Page Load:
- Enable frontend production build
- Optimize images before upload
- Implement lazy loading
- Use CDN for static assets
- Enable browser caching

#### Slow API Responses:
- Add database indexes
- Implement pagination
- Use query optimization
- Enable API caching
- Monitor MongoDB performance

---

## 📊 Reports & Analytics

### Available Reports

#### User Analytics:
- Total users by role
- New registrations (daily/weekly/monthly)
- Active users
- Login statistics

#### Academic Analytics:
- Total departments/courses/batches
- Subject enrollment stats
- Module completion rates
- Assignment submission rates

#### Performance Metrics:
- Average assignment scores
- Subject-wise performance
- Lecturer performance ratings
- Student attendance rates

#### Usage Analytics:
- Meeting frequency and duration
- Content access patterns
- Peak usage times
- Resource utilization

### Exporting Reports

**Available Formats:**
- PDF
- Excel (XLSX)
- CSV
- JSON

**Export Process:**
1. Navigate to Reports section
2. Select report type
3. Choose date range
4. Select format
5. Click **"Export"**
6. Download generated file

---

## 📞 Support & Resources

### Documentation:
- **Main README.md**: Project overview
- **ADMIN_GUIDE.md**: This document
- **LECTURER_GUIDE.md**: Lecturer features
- **API Documentation**: `/api-docs` (Swagger)

### Technical Support:
- Email: support@smartlms.com
- Slack Channel: #smart-lms-support
- GitHub Issues: [repository]/issues

### Training Resources:
- Video Tutorials: Available on admin dashboard
- User Manual: Downloadable PDF
- FAQ Section: Common questions answered
- Webinars: Monthly training sessions

---

## 🔄 Version History

### Version 1.0.0 (November 8, 2025)
- Initial release
- Complete admin functionality
- User management
- Academic structure
- Content management (modules, extra modules)
- AI-powered assignments
- Video meetings (Daily.co)
- Cloudinary integration
- Firebase authentication
- OpenAI integration

---

## 📝 License & Credits

**License**: MIT License

**Credits:**
- Angular Material for UI components
- OpenAI for AI capabilities
- Daily.co for video conferencing
- Cloudinary for file storage
- Firebase for authentication

---

**End of Admin Guide**

*For lecturer-specific features and workflows, refer to [LECTURER_GUIDE.md](./LECTURER_GUIDE.md)*
