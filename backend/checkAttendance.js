const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const StudentEmotion = require('./models/StudentEmotion');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/smart-lms', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

async function checkAttendanceAndEmotions() {
  try {
    // Get the meeting ID from the URL in the screenshot
    const meetingId = '693f9d9e1767cd0fba09787c';
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 CHECKING ATTENDANCE & EMOTION RECORDS');
    console.log('='.repeat(80));
    console.log(`Meeting ID: ${meetingId}\n`);
    
    // Check attendance records
    const attendanceRecords = await Attendance.find({ meetingId })
      .populate('studentId', 'firstName lastName email');
    
    console.log('👥 ATTENDANCE RECORDS:');
    console.log(`Total records found: ${attendanceRecords.length}\n`);
    
    if (attendanceRecords.length === 0) {
      console.log('❌ NO ATTENDANCE RECORDS FOUND!');
      console.log('This is the issue - attendance is not being created when students join.\n');
    } else {
      attendanceRecords.forEach((record, index) => {
        console.log(`Record ${index + 1}:`);
        console.log(`  Student: ${record.studentName}`);
        console.log(`  Email: ${record.studentEmail}`);
        console.log(`  Status: ${record.status}`);
        console.log(`  Sessions: ${record.sessions.length}`);
        console.log(`  First Join: ${record.firstJoinTime}`);
        console.log(`  Currently Present: ${record.isCurrentlyPresent}`);
        console.log(`  Total Duration: ${record.totalDuration}s`);
        console.log('');
      });
    }
    
    // Check emotion records
    const emotionRecords = await StudentEmotion.find({ meetingId })
      .populate('studentId', 'firstName lastName email');
    
    console.log('🎭 EMOTION RECORDS:');
    console.log(`Total records found: ${emotionRecords.length}\n`);
    
    if (emotionRecords.length > 0) {
      // Group by student
      const studentEmotions = {};
      emotionRecords.forEach(record => {
        if (record.studentId) {
          const studentName = `${record.studentId.firstName} ${record.studentId.lastName}`;
          if (!studentEmotions[studentName]) {
            studentEmotions[studentName] = 0;
          }
          studentEmotions[studentName]++;
        }
      });
      
      console.log('Students with emotion tracking:');
      Object.keys(studentEmotions).forEach(name => {
        console.log(`  ${name}: ${studentEmotions[name]} records`);
      });
      console.log('');
    }
    
    // Analysis
    console.log('='.repeat(80));
    console.log('🔍 ANALYSIS:');
    console.log('='.repeat(80));
    
    if (emotionRecords.length > 0 && attendanceRecords.length === 0) {
      console.log('❌ PROBLEM IDENTIFIED:');
      console.log('   - Emotion tracking is working (records found)');
      console.log('   - Attendance tracking is NOT working (no records)');
      console.log('   - The socket join-meeting event is likely not being triggered');
      console.log('   - OR the attendance save is failing silently\n');
      console.log('💡 SOLUTION:');
      console.log('   - Check backend console logs when student joins');
      console.log('   - Verify socket connection is working');
      console.log('   - Check for any errors in attendance creation');
    } else if (emotionRecords.length > 0 && attendanceRecords.length > 0) {
      console.log('✅ Both systems are working');
    } else {
      console.log('⚠️  Neither system has records for this meeting');
    }
    
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

checkAttendanceAndEmotions();
