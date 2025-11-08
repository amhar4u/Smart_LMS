# 👨‍🏫 Smart LMS - Lecturer Guide

**Complete Lecturer Reference Manual**

Version 1.0.0 | Last Updated: November 8, 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [Subject Management](#subject-management)
5. [Module Management](#module-management)
6. [Extra Module Management](#extra-module-management)
7. [Assignment Management](#assignment-management)
8. [Meeting Management](#meeting-management)
9. [Student Engagement](#student-engagement)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

### Welcome to Smart LMS!

As a lecturer, you have access to powerful tools to create engaging learning experiences:

- 📚 **Content Creation**: Upload modules with documents and videos
- 🤖 **AI-Powered Assessments**: Generate questions automatically using AI
- 🎥 **Video Meetings**: Host live classes with emotion detection
- 📊 **Analytics**: Track student progress and engagement
- 💡 **Supplementary Materials**: Provide extra modules for different skill levels

### Your Capabilities

✅ Manage subjects assigned to you  
✅ Create and organize learning modules  
✅ Upload educational content (documents & videos)  
✅ Generate AI-powered assignments  
✅ Schedule and host video meetings  
✅ Monitor student progress  
✅ Grade submissions  
✅ View analytics and reports  

❌ Cannot delete modules (only admin)  
❌ Cannot manage other lecturers' subjects  
❌ Cannot modify student enrollment  

---

## 🚀 Getting Started

### First Login

1. **Login Credentials**:
   - Use the email and password provided by your admin
   - Navigate to: `http://localhost:4200/login`
   - Select **"Lecturer"** role

2. **Initial Setup**:
   - Complete your profile
   - Add profile picture
   - Set preferences
   - Review assigned subjects

3. **Dashboard Tour**:
   - Explore the navigation menu
   - Check assigned subjects
   - Review upcoming meetings
   - Check pending tasks

---

## 📊 Dashboard Overview

**Path:** Lecturer Dashboard (Home)

### Dashboard Widgets

#### 1. **My Subjects Card**
- Total subjects assigned to you
- Click to view full list
- Quick access to subject management

#### 2. **Active Modules Card**
- Count of active learning modules
- Across all your subjects
- Click to manage modules

#### 3. **Active Assignments Card**
- Current open assignments
- Due dates highlighted
- Click to view details

#### 4. **Upcoming Meetings Card**
- Next scheduled meeting
- Time remaining
- Quick join button

#### 5. **Recent Activity**
- Latest student submissions
- New enrollments
- Meeting recordings

### Quick Actions

- **Create Module**: Fast access to module creation
- **Create Assignment**: Quick assignment setup
- **Schedule Meeting**: Instant meeting scheduler
- **View Analytics**: Subject performance overview

---

## 📘 Subject Management

**Path:** Dashboard → My Subjects

### Viewing Your Subjects

#### Subject List:
Each subject card displays:
- Subject Name
- Subject Code
- Department & Course
- Semester
- Student Count
- Module Count
- Status (Active/Inactive)

#### Subject Details:
Click on any subject to view:
- **Overview**: Description, credits, syllabus
- **Students**: Enrolled student list
- **Modules**: All modules for this subject
- **Assignments**: Created assignments
- **Meetings**: Scheduled classes
- **Analytics**: Performance metrics

### Subject Actions

You **cannot**:
- Create new subjects
- Delete subjects
- Modify subject code/name
- Change student enrollment

You **can**:
- View all subject details
- Create content (modules, assignments)
- Schedule meetings
- Grade submissions
- View analytics

---

## 📚 Module Management

**Path:** Dashboard → Modules

### Overview

Modules are the core learning materials for your subjects. Each module can contain:
- Multiple documents (PDF, Word, Excel, PowerPoint)
- One video lecture
- Organized by order/sequence
- Can be activated/deactivated

**Implementation:** November 8, 2025

### File Structure

```
frontend/src/app/component/lecturer/
├── manage-modules/
│   ├── manage-modules.component.ts     (228 lines)
│   ├── manage-modules.component.html   (172 lines)
│   └── manage-modules.component.css    (270 lines)
└── module-view-dialog/
    └── module-view-dialog.component.ts (532 lines)
```

### Access Control

- ✅ View only modules for YOUR subjects
- ✅ Create new modules
- ✅ Edit existing modules
- ✅ Toggle active/inactive status
- ✅ View module details
- ❌ Delete modules (admin only)
- ❌ Access other lecturers' modules

---

### Creating a Module

#### Step 1: Navigate
1. Go to **Dashboard → Modules**
2. Click **"Create Module"** button

#### Step 2: Fill Basic Information
- **Title**: Short title (e.g., "Introduction to Data Structures")
- **Name**: Display name for students
- **Code**: Unique identifier (e.g., "DSA-MOD-001")
- **Description**: Detailed module overview
  - Learning objectives
  - Topics covered
  - Prerequisites (if any)
- **Subject**: Select from YOUR assigned subjects only
- **Order**: Sequence number (1, 2, 3...)

#### Step 3: Upload Documents
- Click **"Upload Documents"** button
- Supported formats:
  - PDF (.pdf)
  - Word (.doc, .docx)
  - Excel (.xls, .xlsx)
  - PowerPoint (.ppt, .pptx)
- **Multiple files** can be uploaded
- Maximum size: 50MB per file
- Files are stored in Cloudinary

**Document Best Practices:**
- Use descriptive filenames
- Keep files under 20MB for faster loading
- Include lecture notes, handouts, references
- Organize by topic/chapter

#### Step 4: Upload Video (Optional)
- Click **"Upload Video"** button
- Supported formats:
  - MP4 (.mp4) - **Recommended**
  - AVI (.avi)
  - MOV (.mov)
- **Single video** per module
- Maximum size: 100MB
- Maximum duration: 2 hours
- Stored in Cloudinary

**Video Best Practices:**
- Resolution: 1080p (1920x1080) recommended
- Format: MP4 with H.264 codec
- Include captions/subtitles
- Keep under 60 minutes per module
- Break longer content into multiple modules

#### Step 5: Review & Create
- Preview all entered information
- Verify files are uploaded correctly
- Click **"Create Module"**
- Module is saved and visible to students (if active)

---

### Module Table Features

#### Table Columns:
| Column | Description |
|--------|-------------|
| Code | Unique module identifier |
| Name | Module display name |
| Subject | Associated subject |
| Documents | Count of uploaded documents |
| Video | ✓ or ✗ indicator |
| Order | Sequence number |
| Status | Active/Inactive toggle |
| Actions | View, Edit buttons |

#### Filters:
- **Subject**: Filter by specific subject
- **Status**: Show active/inactive/all
- **Search**: Search by module name or code
- **Sort**: By order, name, or date created

#### Pagination:
- Default: 10 modules per page
- Options: 5, 10, 25, 50, 100
- Next/Previous navigation

---

### Editing a Module

#### Process:
1. Find module in table
2. Click **Edit** icon (pencil)
3. Dialog opens with pre-filled data
4. Modify any fields:
   - Update description
   - Change order
   - Add/remove documents
   - Replace video
   - Change subject (only your subjects)
5. Click **"Update Module"**

**Notes:**
- Code cannot be changed after creation
- Existing files remain unless replaced
- Students see updated content immediately
- Previous versions are not saved

---

### Viewing Module Details

#### Access:
1. Click **View** icon (eye) in table
2. **View Details** dialog opens

#### Dialog Features:

**Header Section:**
- Module name with gradient blue background
- Module code badge
- Status badge (Active/Inactive)
- Subject information

**Basic Information Section:**
- Title
- Name
- Code
- Description (full text)
- Subject name
- Order number
- Status

**Documents Section:**
- List of all documents
- File name
- File type (PDF, Word, etc.)
- File size (formatted: KB, MB)
- **Actions**:
  - **View**: Open in browser
  - **Download**: Save to computer
- Empty state if no documents

**Video Section:**
- Embedded video player
- Video title
- Duration (formatted: HH:MM:SS)
- File type
- Playback controls:
  - Play/Pause
  - Volume
  - Fullscreen
  - Playback speed
- Empty state if no video

**Metadata Section:**
- Created date
- Last modified date
- Creator name

**Dialog Controls:**
- **Close** button to exit
- Read-only (no editing)
- Beautiful gradient design
- Responsive layout

---

### Activating/Deactivating Modules

#### Toggle Status:
1. Locate module in table
2. Click the **toggle switch** in Status column
3. Confirmation required
4. Status updates immediately

**Active Module:**
- ✅ Visible to students
- ✅ Appears in subject module list
- ✅ Accessible for viewing/download
- Green "Active" badge

**Inactive Module:**
- ❌ Hidden from students
- ❌ Not listed in student view
- ❌ Content not accessible
- Gray "Inactive" badge

**Use Cases for Inactive:**
- Draft modules not ready for students
- Seasonal content (activate when relevant)
- Archived old content
- Modules under revision

---

### Best Practices for Modules

#### Content Organization:
1. **Logical Order**: Number modules sequentially (1, 2, 3...)
2. **Consistent Naming**: Use clear, descriptive names
3. **Complete Descriptions**: Include objectives, topics, prerequisites
4. **Balanced Content**: Mix documents and videos

#### File Management:
1. **Optimize Files**: Compress before upload
2. **Descriptive Names**: "Week1_IntroToDSA.pdf" not "doc1.pdf"
3. **Version Control**: Include version in filename
4. **Accessibility**: Provide transcripts for videos

#### Student Experience:
1. **Progressive Disclosure**: Start with basics, advance gradually
2. **Variety**: Mix text, slides, videos, examples
3. **Engagement**: Include interactive elements, quizzes
4. **Support**: Provide additional resources

---

## 📖 Extra Module Management

**Path:** Dashboard → Extra Modules

### Overview

Extra modules are **supplementary learning materials** that complement the core curriculum. They are optional and categorized by student skill level.

**Key Differences from Regular Modules:**
- **Optional**: Students choose to access
- **Level-Based**: Beginner, Intermediate, Advanced, All
- **No Credits**: Don't count towards grades
- **Flexible**: Can be for enrichment or remedial

**Implementation:** November 8, 2025

### File Structure

```
frontend/src/app/component/lecturer/
├── manage-extra-modules/
│   ├── manage-extra-modules.component.ts     (252 lines)
│   ├── manage-extra-modules.component.html   (192 lines)
│   └── manage-extra-modules.component.css    (287 lines)
└── extra-module-view-dialog/
    └── extra-module-view-dialog.component.ts (576 lines)
```

---

### Creating an Extra Module

#### Process (Similar to Regular Module):

**Step 1: Basic Information**
- Title, Name, Code, Description
- Select Subject (your subjects only)
- Order number

**Step 2: Student Level** (NEW!)
Select target audience:
- **Beginner**: 
  - Foundation concepts
  - No prerequisites
  - Step-by-step explanations
  - Example: "Python Basics for Beginners"
  
- **Intermediate**:
  - Requires basic knowledge
  - Builds on core concepts
  - Example: "Advanced Data Structures"
  
- **Advanced**:
  - For students with solid foundation
  - Complex topics
  - Example: "Algorithm Optimization Techniques"
  
- **All**:
  - Suitable for any level
  - General interest topics
  - Example: "History of Computing"

**Step 3: Upload Content**
- Documents (multiple)
- Video (optional, single)
- Same process as regular modules

**Step 4: Create**
- Review and save
- Set active/inactive status

---

### Extra Module Table

#### Columns:
- Code
- Name
- Subject
- **Student Level** (with color-coded badges)
- Documents count
- Video indicator
- Order
- Status toggle
- Actions (View, Edit)

#### Level Badges:
- **Beginner**: Blue badge 🔵
- **Intermediate**: Orange badge 🟠
- **Advanced**: Red badge 🔴
- **All**: Green badge 🟢

#### Filters:
- Subject
- Student Level
- Status
- Search

---

### Viewing Extra Module Details

**View Dialog Features:**

**Header:**
- Purple gradient background (vs. blue for regular modules)
- Module name and code
- **Dual Badges**:
  - Status badge (Active/Inactive)
  - Level badge (Beginner/Intermediate/Advanced/All)

**Content Sections:**
- Basic Information
- Student Level Classification
- Documents list
- Video player
- Metadata

**Same Features:**
- Embedded video player
- Document download links
- Read-only display
- Beautiful UI

---

### Use Cases for Extra Modules

#### 1. **Remedial Content** (Beginner)
- Refresh basic concepts
- Help struggling students
- Pre-requisite review
- Example: "Algebra Refresher for Calculus"

#### 2. **Enrichment Content** (Advanced)
- Challenge high-performers
- Deep dives into topics
- Research papers
- Example: "Quantum Computing Concepts"

#### 3. **Practical Skills** (All)
- Industry tools
- Career guidance
- Soft skills
- Example: "Git and GitHub Tutorial"

#### 4. **Exam Preparation** (Intermediate)
- Past papers
- Practice problems
- Revision notes
- Example: "Midterm Review Questions"

---

## 📝 Assignment Management

**Path:** Dashboard → Assignments

### Overview

Create assessments with **AI-generated questions** powered by OpenAI GPT-4.

**Features:**
- ✅ Multiple choice, short answer, essay questions
- ✅ AI auto-generation from module content
- ✅ Custom difficulty levels
- ✅ Flexible due dates
- ✅ Automatic grading (MCQ)
- ✅ File upload submissions

**Implementation:** November 8, 2025

### File Structure

```
frontend/src/app/component/lecturer/
└── manage-assignments/
    ├── manage-assignments.component.ts     (510 lines)
    ├── manage-assignments.component.html   (480 lines)
    └── manage-assignments.component.css    (369 lines)
```

**Backend:**
```
backend/
├── routes/assignments.js          (CRUD endpoints)
├── models/Assignment.js           (Mongoose schema)
└── services/aiService.js          (OpenAI integration)
```

---

### Creating an Assignment

#### Step 1: Assignment Details (Tab 1)

**Basic Information:**
- **Title**: Assignment name (e.g., "Week 5 Quiz")
- **Description**: Instructions and objectives

**Academic Association:**
- **Department**: Auto-populated from subject
- **Course**: Auto-populated from subject
- **Batch**: Select target batch
- **Semester**: Select semester
- **Subject**: Select from YOUR subjects only
- **Modules**: Select relevant modules (multiple selection)

**Configuration:**
- **Assignment Type**:
  - Multiple Choice Questions (MCQ)
  - Short Answer
  - Essay
  
- **Difficulty Level**:
  - Easy: Basic recall, simple concepts
  - Medium: Application, analysis
  - Hard: Synthesis, evaluation
  
- **Question Count**: 1-100 questions
- **Marks per Question**: Or total marks (auto-calculated)

**Submission Settings:**
- **Due Date & Time**: Deadline picker
- **Submission Type**:
  - Online (type answers in system)
  - File Upload (submit PDF/Word)
  - Both
- **Time Limit**: Optional timer (minutes)
- **Late Submission**: Allow/Disallow
- **Late Penalty**: Percentage deduction (if allowed)

**Instructions:**
- Custom guidelines for students
- Grading rubric
- Reference materials
- Honor code reminder

---

#### Step 2: AI Question Generation (Tab 2)

**Option A: Generate from Modules**
1. Radio button: "Generate from Module Names"
2. Uses selected modules from Tab 1
3. AI extracts content from module documents
4. Click **"Preview Questions"**

**Option B: Custom Content**
1. Radio button: "Provide Custom Content"
2. Text area appears
3. Paste your content:
   - Lecture notes
   - Textbook chapters
   - Research papers
   - Any relevant text
4. Click **"Preview Questions"**

**AI Generation Process:**

```
Your Input → OpenAI API Request → GPT-4 Processing → Structured JSON → Question Preview
```

**Behind the Scenes:**
```javascript
// AI Service call
const questions = await aiService.generateQuestions({
  content: moduleContent || customContent,
  type: 'MCQ' | 'Short Answer' | 'Essay',
  count: questionCount,
  level: 'Easy' | 'Medium' | 'Hard',
  subject: subjectName
});
```

**GPT-4 Prompt Structure:**
```
Generate {count} {type} questions about {subject}
Difficulty: {level}
Content: {moduleContent}
Format: JSON array with:
- question: string
- options: array (for MCQ)
- answer: string or array
- explanation: string
- marks: number
```

---

#### Step 3: Question Preview

**Preview Display:**
- All generated questions numbered
- Question text
- Options (for MCQ) with labels A, B, C, D
- Correct answer highlighted (green)
- Marks allocation
- Explanation/rationale

**Actions:**
- **Regenerate**: Not satisfied? Generate new set
- **Edit Individual Questions**: Modify text, options, answers
- **Add Custom Question**: Insert your own
- **Delete Question**: Remove unwanted questions
- **Reorder**: Change sequence

**Quality Check:**
- Review each question
- Verify correctness
- Check clarity
- Ensure difficulty matches level
- Validate marks distribution

---

#### Step 4: Save Assignment

1. Review both tabs
2. Confirm all details are correct
3. Click **"Save Assignment"**
4. Success message appears
5. Assignment listed in table
6. Visible to students (if active)

**Post-Creation:**
- Students can view assignment
- Submit answers online or upload files
- System auto-grades MCQs
- You manually grade short answer/essay

---

### Assignment Table

#### Columns:
- **Title** (with description tooltip)
- **Subject**
- **Batch**
- **Semester**
- **Type** (MCQ/Short Answer/Essay badge)
- **Level** (Easy/Medium/Hard badge)
- **Due Date** (highlighted if near)
- **Questions & Marks** (e.g., "10 questions, 50 marks")
- **Status** (Active/Inactive toggle)
- **Submissions** (count of submitted)
- **Actions** (View, Edit, Delete)

#### Filters:
- Subject
- Type
- Level
- Status
- Batch
- Search by title

---

### Grading Submissions

#### For MCQ:
- **Automatic grading**
- Instant results for students
- Score calculated on submission
- Review mode shows:
  - Student answer
  - Correct answer
  - Marks earned/total

#### For Short Answer & Essay:
1. Navigate to **Assignment → Submissions**
2. Click on student submission
3. View submission details:
   - Student info
   - Submission time
   - File uploaded (if file submission)
   - Answers (if online submission)
4. **Manual Grading**:
   - Read each answer
   - Assign marks per question
   - Add feedback comments
   - Total marks auto-calculated
5. Click **"Submit Grade"**
6. Student notified of grade

---

### Assignment Analytics

**View Metrics:**
- Total submissions
- Average score
- Score distribution (histogram)
- Completion rate
- Time taken (average)
- Question-wise analysis:
  - Most missed questions
  - Easiest questions
  - Hardest questions

**Export Options:**
- Export grades to Excel
- Download submission files (ZIP)
- Generate class report (PDF)

---

## 🎥 Meeting Management

**Path:** Dashboard → Meetings

### Overview

Schedule and host live video classes using **Daily.co** integration with:
- HD video/audio
- Screen sharing
- Chat functionality
- Real-time emotion detection
- Automatic attendance tracking

**Implementation:** November 8, 2025

### File Structure

```
frontend/src/app/component/lecturer/
└── lecturer-meeting-list/
    ├── lecturer-meeting-list.component.ts     (350+ lines)
    ├── lecturer-meeting-list.component.html   (200+ lines)
    └── lecturer-meeting-list.component.css    (250+ lines)
```

**Backend:**
```
backend/
├── routes/meetings.js             (Meeting CRUD)
├── models/Meeting.js              (Schema with Daily.co room)
└── services/dailyService.js       (Daily.co API integration)
```

---

### Creating a Meeting

#### Step 1: Meeting Information
1. Click **"Create Meeting"** button
2. Fill in dialog:
   - **Topic**: Meeting title (e.g., "Week 3: Recursion Lecture")
   - **Description**: Agenda, topics to cover

#### Step 2: Academic Details
- **Department**: Auto-filled from subject
- **Course**: Auto-filled from subject
- **Batch**: Select batch
- **Semester**: Select semester
- **Subject**: Select from YOUR subjects only
- **Modules**: Select modules to be covered (multiple)

#### Step 3: Scheduling
- **Meeting Date**: Calendar picker
- **Start Time**: Time picker (HH:MM)
- **Duration**: Minutes (1-480 max, 8 hours)
- **End Time**: Auto-calculated and displayed

#### Step 4: Review & Create
- System automatically:
  - Creates Daily.co room
  - Generates unique join URL
  - Configures room settings:
    - Screen share: Enabled
    - Chat: Enabled
    - Recording: Enabled (for hosts)
  - Sets room expiry (4 hours after end time)
- Click **"Create Meeting"**
- Meeting appears in table

**Room URL Format:**
```
https://yourdomain.daily.co/smart-lms-{meetingId}
```

---

### Meeting Table

#### Columns:
- **Topic** (with description tooltip)
- **Subject**
- **Batch**
- **Date & Time** (formatted nicely)
- **Duration** (formatted: "1h 30m")
- **Status** (color-coded badge):
  - 🔵 Scheduled (blue)
  - 🟢 Ongoing (green)
  - ⚫ Completed (gray)
  - 🔴 Cancelled (red)
- **Students** (enrolled count)
- **Actions**

#### Action Buttons:
- **Edit**: Modify meeting details
- **Delete/Cancel**: Cancel scheduled meeting
- **Start/Join**: Enter meeting room
- **Details**: View full information

#### Filters:
- Subject
- Status
- Date range
- Search by topic

---

### Meeting Lifecycle

#### 1. **Scheduled** (Before Start Time)
**Available Actions:**
- Edit details
- Reschedule date/time
- Cancel meeting
- View details

**Status:**
- Shows countdown: "Starts in 2 hours 15 minutes"
- Badge color: Blue
- Students can see in their schedule

---

#### 2. **Can Start** (15 minutes before - start time)
**Available Actions:**
- **"Start Meeting"** button appears
- Edit (if more than 15 min away)
- Cancel
- View details

**Starting Process:**
1. Click **"Start Meeting"**
2. Daily.co room opens in new window
3. Host controls available:
   - Admit participants
   - Mute all
   - End meeting
   - Start/stop recording
4. Status auto-updates to "Ongoing"

---

#### 3. **Ongoing** (Started, not ended)
**Status:**
- Badge color: Green
- Shows "In Progress"
- Real-time participant count

**Available Actions:**
- **"Join Meeting"**: Re-enter room
- Cannot edit or delete
- View details

**Host Privileges:**
- Full control over room
- Can remove participants
- Can mute/unmute participants
- Can share screen
- Can enable/disable chat
- Can record meeting

---

#### 4. **Completed** (After End Time)
**Status:**
- Badge color: Gray
- Shows "Completed"
- Attendance recorded

**Available Actions:**
- View details
- View attendance
- Access recording (if recorded)
- Cannot edit or delete

**Post-Meeting:**
- Attendance automatically marked
- Meeting recording available
- Chat transcript saved
- Analytics generated

---

### Auto-Refresh Feature

**Real-time Updates:**
- Table refreshes every **60 seconds**
- Status updates automatically
- New meetings appear
- Participant counts update
- No manual refresh needed

**Implementation:**
```typescript
ngOnInit() {
  this.loadMeetings();
  this.autoRefreshSubscription = interval(60000).subscribe(() => {
    this.loadMeetings();
  });
}
```

**Benefits:**
- Always see current status
- Detect when meetings become joinable
- Track ongoing meetings
- Monitor attendance in real-time

---

### Host Capabilities

**During Meeting:**

**Video Controls:**
- Camera on/off
- Microphone mute/unmute
- Video quality settings
- Virtual background (if supported)

**Sharing:**
- Screen share (full screen or window)
- Share system audio
- Whiteboard (integrated)
- File sharing via chat

**Participant Management:**
- View participant list
- Admit waiting participants
- Remove participant (if disruptive)
- Mute all participants
- Spotlight specific participant
- Promote to co-host (if needed)

**Chat Moderation:**
- Enable/disable chat
- Delete inappropriate messages
- Private messaging
- Send files/links

**Recording:**
- Start/stop recording
- Local or cloud recording
- Recording indicator for all
- Access recordings post-meeting

**Meeting Control:**
- Lock meeting (no new joins)
- End meeting for all
- Transfer host rights

---

### Emotion Detection

**Real-Time Analysis:**
- Uses Face API.js
- Detects student emotions:
  - Happy
  - Sad
  - Confused
  - Neutral
  - Surprised
  - Angry
- Analytics dashboard shows:
  - Overall mood
  - Engagement level
  - Attention span
  - Confusion points (timestamps)

**Use Cases:**
- Identify confusing topics (high confusion)
- Gauge engagement (low attention = boring)
- Adjust pacing based on mood
- Intervention for struggling students

---

### Meeting Best Practices

#### Before Meeting:
1. **Test Your Setup**: Camera, microphone, internet
2. **Prepare Materials**: Slides, documents ready to share
3. **Start Early**: Join 5-10 minutes before students
4. **Check Attendance**: Note who's expected

#### During Meeting:
1. **Start on Time**: Respect students' schedules
2. **Engage Students**: Polls, questions, discussions
3. **Monitor Chat**: Answer questions promptly
4. **Watch Emotions**: Adjust if confusion detected
5. **Record Session**: For absent students

#### After Meeting:
1. **Share Recording**: Upload to module
2. **Share Notes**: Meeting summary, key points
3. **Follow Up**: Answer remaining questions
4. **Review Analytics**: Improve next session

---

### Troubleshooting Meetings

#### Issue: Cannot Start Meeting
**Solutions:**
- Check if within 15-minute window
- Refresh page
- Verify meeting status
- Check Daily.co service status

#### Issue: Students Cannot Join
**Solutions:**
- Ensure meeting is started
- Check if meeting locked
- Verify students have correct link
- Check participant limit (100 max)

#### Issue: Poor Video Quality
**Solutions:**
- Reduce video resolution
- Turn off video temporarily
- Check internet speed (min 5 Mbps)
- Close other applications

#### Issue: No Emotion Detection
**Solutions:**
- Grant camera permissions
- Ensure good lighting
- Check browser compatibility
- Verify Face API.js loaded

---

## 👨‍🎓 Student Engagement

### Monitoring Student Progress

**Path:** Subject → Students → Analytics

#### View Per Student:
- Module completion rate
- Assignment scores
- Meeting attendance
- Average time spent
- Engagement level (based on emotions)

#### Identify At-Risk Students:
- Low completion rates
- Missed deadlines
- Poor attendance
- Consistently confused (emotion data)

#### Intervention Strategies:
- Send personalized messages
- Offer extra modules (beginner level)
- Schedule one-on-one meetings
- Provide additional resources

---

### Communication Tools

#### Announcements:
- Post to all students in a subject
- Include attachments
- Schedule for future
- Mark as important

#### Direct Messages:
- Message individual students
- Response tracking
- File attachments
- Read receipts

#### Feedback:
- On assignments (per question)
- On submissions (overall comments)
- In meetings (live feedback)
- On modules (suggestions for improvement)

---

## 🎯 Best Practices

### Content Creation

#### 1. **Modular Design**
- Break content into digestible chunks
- Each module: 30-60 minutes of content
- Clear learning objectives per module
- Logical progression

#### 2. **Multimedia Balance**
- Mix text (PDFs), slides (PPT), videos
- Not just videos or just documents
- Interactive elements where possible
- Visual aids for complex concepts

#### 3. **Accessibility**
- Provide transcripts for videos
- Use readable fonts and sizes
- Color-blind friendly visuals
- Alternative text for images

#### 4. **Regular Updates**
- Review content each semester
- Update outdated information
- Refresh examples, case studies
- Incorporate student feedback

---

### Assessment Strategy

#### 1. **Varied Assessment**
- Mix MCQ, short answer, essay
- Include practical assignments
- Use different difficulty levels
- Assess different skills (recall, application, analysis)

#### 2. **Formative vs. Summative**
- **Formative**: Frequent, low-stakes, feedback-focused
  - Weekly quizzes
  - Practice problems
  - Draft submissions
- **Summative**: Less frequent, high-stakes, grade-focused
  - Midterm exams
  - Final projects
  - Major assignments

#### 3. **Timely Feedback**
- Grade within 1 week of submission
- Provide constructive comments
- Highlight strengths and areas for improvement
- Offer opportunities for revision

#### 4. **AI Usage Ethics**
- Review AI-generated questions carefully
- Ensure accuracy and relevance
- Adjust difficulty if needed
- Add personal touch (context, examples)

---

### Meeting Effectiveness

#### 1. **Preparation**
- Share agenda beforehand
- Upload pre-reading materials
- Prepare slides/demos
- Test technology

#### 2. **Engagement Techniques**
- Start with icebreaker
- Use polls and quizzes
- Breakout rooms for discussions
- Q&A sessions
- Real-time problem solving

#### 3. **Pacing**
- 15-20 minutes per topic
- Breaks every 45-60 minutes
- Time for questions
- Don't rush through content

#### 4. **Inclusivity**
- Encourage quiet students to participate
- Use chat for shy students
- Multilingual support if needed
- Record for accessibility

---

### Time Management

#### Weekly Routine:
- **Monday**: Review last week's submissions, plan this week
- **Tuesday-Thursday**: Create content, grade, prepare meetings
- **Friday**: Host meetings, respond to messages
- **Weekend**: Review analytics, plan next week

#### Efficiency Tips:
- Batch similar tasks (grade all assignments at once)
- Use templates for common announcements
- Schedule meetings at fixed times
- Automate where possible (MCQ grading)

---

## 🔧 Troubleshooting

### Common Issues

#### 1. **Cannot See My Subjects**
**Symptoms**: Subject list is empty

**Solutions:**
- Contact admin to assign subjects
- Refresh page and clear cache
- Verify you're logged in as lecturer
- Check if subjects are active

---

#### 2. **File Upload Fails**
**Symptoms**: Upload stuck or error message

**Solutions:**
- Check file size (max 100MB)
- Verify file format is supported
- Try smaller file or compress
- Check internet connection
- Try different browser

**Supported Formats:**
- Documents: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- Videos: MP4, AVI, MOV

---

#### 3. **AI Question Generation Fails**
**Symptoms**: "Preview Questions" button loads forever

**Solutions:**
- Check if module content exists
- Try custom content instead
- Reduce question count (try 5 instead of 20)
- Check OpenAI service status
- Contact admin (may be API limit/quota)

**Error Messages:**
- "Insufficient credits": Admin needs to add OpenAI credits
- "Content too long": Reduce content or split into parts
- "Invalid format": Ensure content is text (not images)

---

#### 4. **Students Cannot Access Module**
**Symptoms**: Students report "Module not found"

**Solutions:**
- Check if module status is "Active"
- Verify students are enrolled in correct batch
- Check subject assignment
- Confirm module has at least one document or video
- Try activating/deactivating module

---

#### 5. **Meeting Room Won't Load**
**Symptoms**: Daily.co room shows error

**Solutions:**
- Check if meeting is within valid time (15 min before to end time)
- Grant browser camera/microphone permissions
- Disable browser extensions
- Try incognito/private mode
- Use different browser (Chrome recommended)
- Check firewall/antivirus settings

**Browser Compatibility:**
- ✅ Chrome (best)
- ✅ Firefox
- ✅ Safari (Mac)
- ✅ Edge
- ❌ Internet Explorer

---

#### 6. **Cannot Edit Module**
**Symptoms**: Edit button doesn't work

**Solutions:**
- Verify module belongs to your subject
- Check if module is locked by admin
- Refresh page
- Clear browser cache
- Try different browser

**Note**: You can only edit modules for subjects assigned to you.

---

### Getting Help

#### Documentation:
- **LECTURER_GUIDE.md**: This document
- **ADMIN_GUIDE.md**: Admin features (if you need admin help)
- **API Documentation**: `/api-docs` endpoint

#### Support Channels:
- **Email**: support@smartlms.com
- **In-App Chat**: Help icon in dashboard
- **Admin Contact**: Reach out to system administrator
- **FAQ**: Common questions section

#### Training:
- **Video Tutorials**: Available in Help section
- **Webinars**: Monthly training sessions
- **User Manual**: Downloadable PDF guide

---

## 📊 Reporting & Analytics

### Subject Analytics

**Path:** Subject → Analytics

#### Enrollment Stats:
- Total students enrolled
- Active students (recently active)
- Inactive students (no activity for 7+ days)
- Dropout rate

#### Content Engagement:
- Module views per module
- Average time spent per module
- Video completion rates
- Document downloads

#### Assignment Performance:
- Average scores by assignment
- Score distribution (histogram)
- Completion rates
- Time taken to complete

#### Meeting Attendance:
- Attendance rate per meeting
- Average meeting duration
- Participant engagement (emotion data)
- Peak attendance times

---

### Export Reports

**Available Formats:**
- PDF (formatted report)
- Excel (data for analysis)
- CSV (raw data)

**Report Types:**
- Student performance summary
- Assignment grades
- Attendance records
- Content engagement

**Process:**
1. Navigate to Analytics
2. Select report type
3. Choose date range
4. Click **"Export"**
5. Select format
6. Download file

---

## 🔄 Updates & Changelog

### Version 1.0.0 (November 8, 2025)

**New Features:**
- ✅ Module Management
  - Create, edit, view modules
  - Upload documents and videos
  - Activate/deactivate modules
  - Beautiful view-only dialog
  
- ✅ Extra Module Management
  - Student level classification (Beginner/Intermediate/Advanced/All)
  - Same features as regular modules
  - Purple-themed UI for distinction
  
- ✅ Assignment Management
  - AI-powered question generation (OpenAI GPT-4)
  - MCQ, short answer, essay types
  - Flexible submission settings
  - Automatic MCQ grading
  
- ✅ Meeting Management
  - Daily.co integration
  - Real-time emotion detection
  - Auto-refresh every 60 seconds
  - Host privileges and controls
  - Automatic attendance tracking

**Components:**
- `LecturerManageModulesComponent` (228 lines TS, 172 lines HTML, 270 lines CSS)
- `LecturerManageExtraModulesComponent` (252 lines TS, 192 lines HTML, 287 lines CSS)
- `ModuleViewDialogComponent` (532 lines TS)
- `ExtraModuleViewDialogComponent` (576 lines TS)
- `LecturerMeetingListComponent` (350+ lines TS, 200+ lines HTML, 250+ lines CSS)
- `ManageAssignmentsComponent` (510 lines TS, 480 lines HTML, 369 lines CSS)

**Routes Added:**
- `/lecturer/modules` → Module management
- `/lecturer/extra-modules` → Extra module management
- `/lecturer/assignments` → Assignment management
- `/lecturer/meetings` → Meeting management

**Navigation:**
- "Modules" menu item (library_books icon)
- "Extra Modules" menu item (auto_stories icon)
- "Assignments" menu item (assignment icon)
- "Meetings" menu item (video_call icon)

**Access Control:**
- All features restricted to lecturer's assigned subjects only
- No delete permissions (admin only)
- Subject-based filtering on all endpoints

---

## 📞 Support & Resources

### Quick Links

- **Dashboard**: Main lecturer interface
- **Help Center**: In-app help documentation
- **Video Tutorials**: Step-by-step guides
- **FAQ**: Frequently asked questions

### Contact

- **Technical Support**: support@smartlms.com
- **Admin Office**: admin@smartlms.com
- **Emergency**: +1-XXX-XXX-XXXX

### Training Resources

- **Getting Started Guide**: New lecturer onboarding
- **Video Tutorials**: YouTube channel
- **Webinars**: Monthly Q&A sessions
- **User Manual**: Comprehensive PDF guide

---

## 📝 License & Credits

**License**: MIT License

**Developed by**: Smart LMS Team

**Powered by:**
- Angular Material (UI Components)
- OpenAI GPT-4 (AI Question Generation)
- Daily.co (Video Conferencing)
- Cloudinary (File Storage)
- Firebase (Authentication)
- Face API.js (Emotion Detection)

---

**End of Lecturer Guide**

*For administrative features and system configuration, refer to [ADMIN_GUIDE.md](./ADMIN_GUIDE.md)*

**Happy Teaching! 📚✨**
