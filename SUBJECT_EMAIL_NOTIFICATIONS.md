# Subject Email Notifications Feature

## Overview
This feature automatically sends email notifications when administrators create or update subjects in the Smart LMS system. Emails are sent to:
- **Lecturers**: When they are assigned to a subject
- **Students**: When a new subject is available for their batch and semester

## Features

### 1. **New Subject Creation**
When an admin creates a new subject:
- ✅ The assigned lecturer receives a notification email with subject details
- ✅ All enrolled students in the same batch and semester receive enrollment notification
- ✅ Emails are sent asynchronously (non-blocking)

### 2. **Subject Update**
When an admin updates a subject and changes the lecturer:
- ✅ The new lecturer receives a notification email
- ✅ Only sent if the lecturer is actually changed

## Email Templates

### Lecturer Assignment Email
**Subject:** 📚 New Subject Assigned to You - Smart LMS

**Content includes:**
- Subject name and code
- Credit hours
- Department, course, batch, and semester information
- Subject description (if provided)
- List of available actions (create modules, assignments, meetings, etc.)
- Direct link to view the subject

### Student Enrollment Email
**Subject:** 📚 New Subject Available - Smart LMS

**Content includes:**
- Subject name and code
- Credit hours
- Lecturer name
- Semester information
- Subject description (if provided)
- List of available features (modules, assignments, meetings, etc.)
- Direct link to view the subject

## Implementation Details

### Files Modified

1. **`backend/services/emailService.js`**
   - Added `sendSubjectAssignmentEmailToLecturer()` function
   - Added `sendSubjectEnrollmentEmailToStudent()` function
   - Both functions use beautiful HTML email templates

2. **`backend/routes/subjects.js`**
   - Imported email service functions
   - Updated POST `/` endpoint to send emails on subject creation
   - Updated PUT `/:id` endpoint to send email when lecturer changes
   - Added response fields to indicate emails sent

### API Response Updates

#### Create Subject Response
```json
{
  "success": true,
  "message": "Subject created successfully",
  "data": { /* subject object */ },
  "emailsSent": {
    "lecturer": true,
    "students": 5
  }
}
```

#### Update Subject Response
```json
{
  "success": true,
  "message": "Subject updated successfully",
  "data": { /* subject object */ },
  "lecturerEmailSent": true
}
```

## How It Works

### Subject Creation Flow
1. Admin creates a new subject via the API
2. Subject is validated and saved to database
3. Subject is populated with related data (department, course, batch, semester, lecturer)
4. Email is sent to the assigned lecturer (async)
5. System finds all students in the same batch and semester
6. Emails are sent to all enrolled students (async)
7. API responds with success and email count

### Subject Update Flow
1. Admin updates a subject via the API
2. System checks if the lecturer has changed
3. Subject is updated in the database
4. If lecturer changed, email is sent to the new lecturer (async)
5. API responds with success and email status

## Email Configuration

### Environment Variables
Make sure these are set in your `.env` file:

```env
# Email Configuration
EMAIL_USER=noreply.smartlms@gmail.com
EMAIL_PASS=your_app_password_here

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:4200

# Optional: Test emails
TEST_LECTURER_EMAIL=lecturer@test.com
TEST_STUDENT_EMAIL=student@test.com
```

### Gmail App Password
If using Gmail:
1. Enable 2-Factor Authentication on your Google Account
2. Go to Google Account Settings → Security
3. Generate an App Password for "Mail"
4. Use this password in `EMAIL_PASS`

## Testing

### Manual Test
Run the test script:
```bash
cd backend
node test-subject-email.js
```

This will send test emails to the configured test email addresses.

### Integration Test
1. Create a subject through the admin panel
2. Check the lecturer's email inbox
3. Check enrolled students' email inboxes
4. Verify emails are received with correct information

## Error Handling

- Email sending errors are logged but don't block the API response
- If email fails to send, the subject is still created/updated successfully
- Errors are caught and logged with descriptive messages
- Individual student email failures don't affect other students

## Email Delivery

### Asynchronous Sending
- Emails are sent asynchronously using promises
- The API responds immediately without waiting for emails
- This ensures fast response times even with many students

### Logging
All email activities are logged:
- ✅ Success: Shows recipient email and message ID
- ❌ Failure: Shows error details for debugging

Example logs:
```
✅ [EMAIL] Subject assignment email sent to lecturer: {
  to: 'lecturer@example.com',
  subject: 'Introduction to Computer Science',
  messageId: '<abc123@gmail.com>'
}

📧 [SUBJECT] Sending enrollment emails to 25 students...
```

## Benefits

1. **Instant Notifications**: Users are immediately informed of subject assignments
2. **Professional Communication**: Branded, formatted HTML emails
3. **Better Engagement**: Students know when new subjects are available
4. **Reduced Manual Work**: No need for admins to manually notify users
5. **Complete Information**: All relevant details in one email
6. **Direct Links**: Quick access to the platform

## Future Enhancements

Potential improvements:
- [ ] Email preferences/opt-out for users
- [ ] Digest emails (daily/weekly summary)
- [ ] Email templates customization in admin panel
- [ ] Email delivery status tracking
- [ ] Resend failed emails functionality
- [ ] Multiple language support for emails
- [ ] Email analytics (open rates, click rates)

## Troubleshooting

### Emails Not Sending

1. **Check Gmail credentials**
   - Verify `EMAIL_USER` and `EMAIL_PASS` in `.env`
   - Ensure using App Password, not regular password

2. **Check logs**
   - Look for error messages in terminal
   - Check if email service is being called

3. **Test email service**
   - Run `node test-subject-email.js`
   - Check if test emails are received

4. **Check spam folder**
   - Automated emails may be marked as spam initially
   - Mark as "Not Spam" to whitelist

### Students Not Receiving Emails

1. **Verify student enrollment**
   - Ensure students have the correct batch and semester
   - Check `status: 'approved'` and `isActive: true`

2. **Check student email addresses**
   - Verify email addresses are valid
   - Check for typos in student records

3. **Review query**
   - The query finds students by: `role: 'student'`, `batch`, `semester`, `status: 'approved'`, `isActive: true`

## Support

For issues or questions:
- Check the logs for error messages
- Review the email configuration
- Test with the provided test script
- Contact the development team

---

**Last Updated:** November 17, 2025
**Version:** 1.0.0
