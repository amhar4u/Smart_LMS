# 👨‍💼 Admin Guide - Smart LMS

## 📋 Overview

Complete administrator guide for managing the Smart LMS platform including user management, course structure, meetings, assignments, and system monitoring.

---

## 🔐 Admin Access

**Login:** `http://192.168.8.168:4200`
- Email: `admin@gmail.com`
- Role: Administrator
- Permissions: Full system access

---

## 🎯 Admin Dashboard

### Quick Statistics:
- Total Users (Admin, Lecturers, Students)
- Total Courses
- Active Semesters
- Active Batches
- Total Subjects
- Active Meetings

### Recent Activities:
- Latest user registrations
- Recent course updates
- Meeting schedules
- System notifications

---

## 👥 User Management

### Create User:
1. Navigate to **Users** → **Add User**
2. Fill in details:
   - First Name, Last Name
   - Email (unique)
   - Role: Admin / Lecturer / Student
   - Password (min 6 characters)
3. Click **Create User**

### Manage Users:
- **View All Users**: List with filters (role, status)
- **Edit User**: Update details, change role
- **Delete User**: Remove user (confirm action)
- **Reset Password**: Generate new password
- **Enable/Disable**: Activate or deactivate accounts

### User Roles:

**Administrator:**
- Full system access
- User management
- Course/subject management
- System configuration

**Lecturer:**
- Create/manage courses
- Create/manage subjects
- Create assignments
- Host meetings
- Grade submissions
- View student progress

**Student:**
- Enroll in courses
- View subjects
- Submit assignments
- Join meetings
- Track progress

---

## 📚 Course Management

### Create Course:
1. Go to **Courses** → **Add Course**
2. Enter:
   - Course Code (e.g., CS101)
   - Course Name
   - Description
   - Credits
   - Department
3. Click **Save**

### Manage Courses:
- **View Courses**: List all courses
- **Edit Course**: Update details
- **Delete Course**: Remove (if no enrollments)
- **Assign Lecturers**: Link lecturers to courses
- **View Enrollments**: See enrolled students

---

## 🏢 Department Management

### Create Department:
1. Navigate to **Departments** → **Add Department**
2. Fill in:
   - Department Code
   - Department Name
   - Description
   - Head of Department
3. Click **Create**

### Manage Departments:
- View all departments
- Edit department details
- Assign courses to departments
- Assign lecturers to departments

---

## 📅 Semester Management

### Create Semester:
1. Go to **Semesters** → **Add Semester**
2. Enter:
   - Semester Name (e.g., "Fall 2025")
   - Academic Year
   - Start Date
   - End Date
   - Status: Active / Inactive
3. Click **Save**

### Manage Semesters:
- **Activate/Deactivate**: Control current semester
- **View Batches**: See all batches in semester
- **Edit Details**: Update dates, status

---

## 👨‍🎓 Batch Management

### Create Batch:
1. Navigate to **Batches** → **Add Batch**
2. Fill in:
   - Batch Name (e.g., "Batch 2025-A")
   - Course
   - Semester
   - Start Year
   - End Year
3. **Enroll Students**: Add students to batch
4. Click **Save**

### Manage Batches:
- View all batches
- Edit batch details
- Add/remove students
- Assign subjects to batch
- View batch statistics

---

## 📖 Subject Management

### Create Subject:
1. Go to **Subjects** → **Add Subject**
2. Enter:
   - Subject Code
   - Subject Name
   - Description
   - Credits
   - Course
   - Semester
3. **Assign Lecturer**
4. Click **Create**

### Manage Subjects:
- View all subjects
- Edit subject details
- Assign/change lecturers
- Create modules
- Create assignments
- View enrolled students

---

## 📝 Module Management

### Create Module:
1. Navigate to subject details
2. Click **Modules** → **Add Module**
3. Enter:
   - Module Number
   - Module Name
   - Description
   - Learning Objectives
   - Resources (PDFs, links)
4. Click **Save**

### Extra Modules by Level:
- **Level 1 (Beginner)**: Basic content
- **Level 2 (Intermediate)**: Standard content
- **Level 3 (Advanced)**: Advanced content
- **Unlocking**: Based on student quiz performance

---

## 📋 Assignment Management

### Monitor Assignments:
1. View all assignments across subjects
2. Filter by:
   - Subject
   - Status (Active/Expired)
   - Due Date
3. View statistics:
   - Total submissions
   - Pending reviews
   - Average grades

### Assignment Actions:
- View submissions
- Monitor grading progress
- Send reminders to students
- Extend deadlines (if needed)

---

## 🎥 Meeting Management

### Monitor Meetings:
1. **Active Meetings**: Currently ongoing
2. **Scheduled Meetings**: Upcoming meetings
3. **Completed Meetings**: Past meetings

### Meeting Details:
- Subject and lecturer
- Date and time
- Duration
- Meeting link (Daily.co)
- Participants count
- Attendance records
- Emotion tracking data

### Meeting Actions:
- View attendance reports
- Download attendance CSV
- View emotion analytics
- Generate meeting report

---

## 📊 Attendance Tracking

### View Attendance:
1. Navigate to **Meetings** → Select meeting
2. Click **Attendance Report**
3. View:
   - Total students
   - Present count
   - Late arrivals
   - Attendance percentage per student
   - Join/leave times
   - Session details (if rejoined)

### Attendance Reports:
- **Meeting Report**: All students in specific meeting
- **Student Report**: All meetings for specific student
- **Batch Report**: Attendance summary for batch
- **Export**: Download as CSV/PDF

### Attendance Status:
- **Present**: >75% attendance
- **Partial**: 50-75% attendance
- **Absent**: <50% attendance
- **Late**: Joined >5 minutes after start

---

## 🎭 Emotion Tracking

### View Emotion Data:
1. Go to **Meetings** → Select meeting
2. Click **Emotion Analytics**
3. View:
   - Student engagement levels
   - Emotion distribution (Happy, Sad, Angry, etc.)
   - Attentiveness scores
   - Alert history

### Emotion Reports:
- **Real-time Dashboard**: Live emotion updates during meeting
- **Post-Meeting Analysis**: Emotion trends over time
- **Student Comparison**: Compare engagement across students
- **Alert Log**: Students with negative emotions or low attention

### Emotion Metrics:
- Average attentiveness per student
- Dominant emotions during meeting
- Face detection success rate
- Alert frequency and severity

---

## 📈 Analytics & Reports

### System Analytics:
- User growth trends
- Course enrollment statistics
- Assignment submission rates
- Meeting attendance trends
- Student performance metrics

### Generate Reports:
1. **User Reports**:
   - Active users by role
   - Registration trends
   - User activity logs

2. **Academic Reports**:
   - Course completion rates
   - Assignment statistics
   - Grade distribution
   - Subject performance

3. **Attendance Reports**:
   - Meeting attendance summary
   - Student attendance history
   - Late arrival patterns
   - Batch attendance comparison

4. **Engagement Reports**:
   - Emotion tracking summary
   - Student engagement trends
   - Alert frequency analysis
   - Attentiveness scores

### Export Options:
- PDF reports
- CSV data export
- Excel spreadsheets
- JSON data dump

---

## 🔧 System Configuration

### General Settings:
- System name and logo
- Academic calendar settings
- Grading scale configuration
- Email notification templates

### Feature Configuration:

**Emotion Tracking:**
```
Location: backend/.env
Setting: EMOTION_TRACKING_INTERVAL
Default: 60000 (1 minute)
Production: 300000 (5 minutes)
```

**Attendance:**
- Late arrival grace period (default: 5 minutes)
- Minimum attendance percentage (default: 75%)
- Session timeout settings

**Assignments:**
- AI grading settings (OpenAI/Gemini API)
- Point-based grading system
- Late submission penalties
- File upload limits

**Meetings:**
- Daily.co API configuration
- Maximum meeting duration
- Recording settings

---

## 🛡️ Security Management

### Access Control:
- Role-based permissions
- JWT token expiration (default: 7 days)
- Session management
- Password policies

### Data Protection:
- Database backups
- User data encryption
- Secure file storage (Cloudinary)
- API rate limiting

### Audit Logs:
- User login/logout events
- Data modification logs
- File access logs
- System error logs

---

## 🗄️ Database Management

### MongoDB Collections:
- **users**: All user accounts
- **courses**: Course definitions
- **subjects**: Subject details
- **batches**: Student batches
- **assignments**: Assignment data
- **submissions**: Student submissions
- **meetings**: Meeting records
- **attendances**: Attendance records
- **studentemotions**: Emotion data
- **studentsubjectlevels**: Student progress levels

### Database Operations:
```bash
# Backup database
mongodump --uri="mongodb+srv://..." --out=./backup

# Restore database
mongorestore --uri="mongodb+srv://..." ./backup

# Check collection counts
mongosh
use smart_lms
db.users.countDocuments()
db.attendances.countDocuments()
db.studentemotions.countDocuments()
```

---

## 🚨 Troubleshooting

### Common Issues:

**Users can't login:**
- Check user status (active/inactive)
- Verify email and password
- Check JWT token expiration
- Review error logs

**Meetings not starting:**
- Verify Daily.co API credentials
- Check meeting room URL generation
- Ensure students have permissions
- Check network connectivity

**Attendance not recorded:**
- Verify backend server running
- Check Socket.IO connection
- Ensure MongoDB connected
- Review backend console logs

**Emotions not tracked:**
- Check Face-API models exist
- Verify camera permissions
- Ensure Socket.IO connected
- Check emotion tracking interval setting

**Assignments not submitted:**
- Check file upload limits
- Verify Cloudinary configuration
- Check deadline hasn't passed
- Review submission error logs

---

## 📞 System Monitoring

### Health Checks:

**Backend Status:**
```bash
curl http://localhost:3000/api/test
# Should return: {"message":"Backend is working!"}
```

**Database Connection:**
```bash
# Check backend console for:
✅ Connected to MongoDB
📦 Database: smart_lms
```

**Socket.IO Status:**
```bash
# Check backend console for:
✅ ENABLED FEATURES:
   🔌 Socket.IO - Real-time communication
   🎭 Emotion Tracking - Face detection & analysis
   📝 Attendance Tracking - Join/leave monitoring
```

### Performance Monitoring:
- Server CPU and memory usage
- Database query performance
- API response times
- Socket.IO connection count
- Active user sessions

---

## 🔄 Maintenance Tasks

### Daily:
- Monitor error logs
- Check system performance
- Review user complaints
- Verify backup completion

### Weekly:
- Review analytics reports
- Check database size
- Update system documentation
- Test critical features

### Monthly:
- Database cleanup (old sessions, logs)
- Security audit
- Performance optimization
- Update dependencies

---

## 📋 Quick Reference

### Admin URLs:
```
Dashboard:      /admin/dashboard
Users:          /admin/users
Courses:        /admin/courses
Subjects:       /admin/subjects
Batches:        /admin/batches
Meetings:       /admin/meetings
Reports:        /admin/reports
Settings:       /admin/settings
```

### API Endpoints:
```
Users:          /api/users
Courses:        /api/courses
Subjects:       /api/subjects
Assignments:    /api/assignments
Meetings:       /api/meetings
Attendance:     /api/attendance
Emotions:       /api/emotions
Statistics:     /api/statistics
```

### Server Commands:
```bash
# Start backend
cd backend && node server.js

# Start frontend
cd frontend && ng serve --host 0.0.0.0

# Restart all (Windows)
restart-all.bat

# View logs
tail -f backend/logs/error.log
```

---

## ✅ Admin Checklist

### Daily Tasks:
- [ ] Monitor active meetings
- [ ] Review attendance reports
- [ ] Check emotion tracking alerts
- [ ] Review pending assignment submissions
- [ ] Check system health

### Weekly Tasks:
- [ ] Generate analytics reports
- [ ] Review user feedback
- [ ] Update course materials
- [ ] Backup database
- [ ] Test critical features

### Monthly Tasks:
- [ ] Performance review
- [ ] Security audit
- [ ] User training
- [ ] System updates
- [ ] Documentation update

---

**Admin Support:** For technical issues, check backend console logs and MongoDB connection status.

**Last Updated:** November 16, 2025
