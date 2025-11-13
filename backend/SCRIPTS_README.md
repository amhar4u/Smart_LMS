# Backend Utility Scripts

This directory contains utility scripts to help manage and troubleshoot the Smart LMS system.

## Assignment Submission Scripts

### 1. testSubmissionFix.js
**Purpose:** Check the current state of assignment submissions

**Usage:**
```bash
# Check all submissions for an assignment
node testSubmissionFix.js <assignmentId>

# Check specific student's submission
node testSubmissionFix.js <assignmentId> <studentId>
```

**Example:**
```bash
node testSubmissionFix.js 6915077a286195b201837eea
node testSubmissionFix.js 6915077a286195b201837eea 673456789abcdef012345678
```

**Output:**
- Assignment details
- List of all submissions
- Status of each submission (started/submitted/evaluated)
- Summary statistics
- Specific student status (if studentId provided)

---

### 2. cleanupSubmissions.js
**Purpose:** Clean up problematic or stuck submissions

**Usage:**
```bash
# Interactive mode (menu-driven)
node cleanupSubmissions.js

# Remove old started-but-not-submitted submissions
node cleanupSubmissions.js old [hours]

# Reset specific student's submission
node cleanupSubmissions.js reset <assignmentId> <studentId>

# Check for duplicate submissions
node cleanupSubmissions.js duplicates
```

**Examples:**
```bash
# Interactive
node cleanupSubmissions.js

# Remove submissions started >24 hours ago but never submitted
node cleanupSubmissions.js old 24

# Reset specific student
node cleanupSubmissions.js reset 6915077a286195b201837eea 673456789abcdef012345678

# Find duplicates
node cleanupSubmissions.js duplicates
```

**Features:**
- Safely removes old stuck submissions
- Allows manual reset of specific student submissions
- Detects duplicate submissions (shouldn't exist)
- Confirmation prompts for safety

---

### 3. testAPI.js
**Purpose:** Automated testing of assignment submission API endpoints

**Setup:**
1. Open the file
2. Update these values:
   ```javascript
   const STUDENT_TOKEN = 'your_actual_student_token';
   const ADMIN_TOKEN = 'your_actual_admin_token';
   const ASSIGNMENT_ID = 'actual_assignment_id';
   ```
3. Make sure server is running

**Usage:**
```bash
node testAPI.js
```

**What it tests:**
1. ✅ Start assignment
2. ✅ Try to start again (should allow continuation)
3. ✅ Submit assignment
4. ✅ Try to submit again (should fail with error)
5. ✅ Get submissions (admin)
6. ✅ Delete submission (admin)
7. ✅ Resubmit after deletion (should work)

**Requirements:**
- Server must be running (`npm start`)
- Valid student and admin tokens
- `axios` package installed

---

## Other Existing Scripts

### checkSubmission.js
Check submission details for debugging

### deleteSubmission.js
Delete a specific submission (admin use)

### cleanupEmptySubmissions.js
Remove empty/incomplete submissions

### testSubmissionProcess.js
Test the complete submission and evaluation process

---

## Getting Tokens for Testing

### Method 1: Browser DevTools
1. Login as student/admin in browser
2. Open DevTools (F12)
3. Go to Application → Local Storage
4. Find `token` or `authToken`

### Method 2: Network Tab
1. Login as student/admin
2. Open DevTools → Network tab
3. Look at any API request
4. Check Headers → Authorization: Bearer TOKEN

### Method 3: Using Postman/Insomnia
1. POST to `/api/auth/login`
2. Body: `{ "email": "...", "password": "..." }`
3. Copy token from response

---

## Troubleshooting

### "Cannot find module"
```bash
cd backend
npm install
```

### "Connection refused"
Make sure MongoDB is running:
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

### "Invalid token"
Your token may have expired. Login again to get a new token.

### Database connection error
Check `.env` file has correct `MONGODB_URI`:
```
MONGODB_URI=mongodb://localhost:27017/smart_lms
```

---

## Safe to Use?

✅ **testSubmissionFix.js** - READ ONLY, completely safe
✅ **testAPI.js** - Tests API, but has confirmation prompts
⚠️ **cleanupSubmissions.js** - DELETES data, but has confirmation prompts
⚠️ **Other delete scripts** - Use with caution, make backups first

---

## Best Practices

1. **Always test on development database first**
2. **Backup database before running cleanup scripts**
   ```bash
   mongodump --db smart_lms --out backup/
   ```
3. **Check submissions with testSubmissionFix.js before deleting**
4. **Keep tokens secure** - Don't commit them to git

---

## Questions?

Refer to:
- `ASSIGNMENT_SUBMISSION_FIX.md` - Detailed documentation
- `QUICK_FIX_SUMMARY.md` - Quick reference guide
- Backend logs - Check terminal for detailed error messages

---

**Last Updated:** 2025-11-13
