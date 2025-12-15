require('dotenv').config();
const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const StudentEmotion = require('./models/StudentEmotion');
const Meeting = require('./models/Meeting');

const MEETING_ID = '693f9d9e1767cd0fba09787c'; // From screenshot URL

async function diagnoseAttendance() {
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    console.log('='.repeat(80));
    console.log('📊 ATTENDANCE DIAGNOSTIC FOR MEETING');
    console.log('='.repeat(80));
    console.log(`Meeting ID: ${MEETING_ID}\n`);

    // Check if meeting exists
    const meeting = await Meeting.findById(MEETING_ID);
    if (!meeting) {
      console.log('❌ Meeting not found in database!');
      console.log('   This meeting ID does not exist.\n');
      return;
    }

    console.log('✅ Meeting found:');
    console.log(`   Topic: ${meeting.topic}`);
    console.log(`   Status: ${meeting.status}`);
    console.log(`   Date: ${meeting.meetingDate}`);
    console.log(`   Start Time: ${meeting.startTime}`);
    console.log(`   Started At: ${meeting.startedAt || 'Not started'}`);
    console.log(`   Ended At: ${meeting.endedAt || 'Not ended'}\n`);

    // Check attendance records
    const attendanceRecords = await Attendance.find({ meetingId: MEETING_ID })
      .populate('studentId', 'firstName lastName email');

    console.log('👥 ATTENDANCE RECORDS:');
    console.log(`   Total records: ${attendanceRecords.length}`);
    
    if (attendanceRecords.length === 0) {
      console.log('   ❌ NO ATTENDANCE RECORDS FOUND!\n');
      console.log('   💡 This means:');
      console.log('      - Students joined the meeting via Daily.co');
      console.log('      - BUT the socket "join-meeting" event was not triggered');
      console.log('      - OR the attendance save failed');
      console.log('      - Check backend logs for socket events\n');
    } else {
      console.log('');
      attendanceRecords.forEach((record, index) => {
        console.log(`   Record ${index + 1}:`);
        console.log(`     Student: ${record.studentName}`);
        console.log(`     Status: ${record.status}`);
        console.log(`     Sessions: ${record.sessions.length}`);
        console.log(`     First Join: ${record.firstJoinTime}`);
        console.log(`     Is Currently Present: ${record.isCurrentlyPresent}`);
        console.log(`     Total Duration: ${record.totalDuration}s`);
        console.log(`     Attendance %: ${record.attendancePercentage}%`);
        console.log('');
      });
    }

    // Check emotion records
    const emotionRecords = await StudentEmotion.find({ meetingId: MEETING_ID })
      .populate('studentId', 'firstName lastName email');

    console.log('🎭 EMOTION TRACKING RECORDS:');
    console.log(`   Total records: ${emotionRecords.length}`);

    if (emotionRecords.length === 0) {
      console.log('   ❌ NO EMOTION RECORDS FOUND!\n');
    } else {
      // Group by student
      const studentEmotions = {};
      emotionRecords.forEach(record => {
        if (record.studentId) {
          const studentName = `${record.studentId.firstName} ${record.studentId.lastName}`;
          if (!studentEmotions[studentName]) {
            studentEmotions[studentName] = {
              count: 0,
              studentId: record.studentId._id
            };
          }
          studentEmotions[studentName].count++;
        }
      });

      console.log('');
      Object.keys(studentEmotions).forEach(name => {
        const data = studentEmotions[name];
        console.log(`   ${name}:`);
        console.log(`     Emotion records: ${data.count}`);
        console.log(`     Student ID: ${data.studentId}`);
        
        // Check if this student has attendance
        const hasAttendance = attendanceRecords.some(a => 
          a.studentId && a.studentId._id.toString() === data.studentId.toString()
        );
        console.log(`     Has attendance record: ${hasAttendance ? '✅ YES' : '❌ NO'}`);
        console.log('');
      });
    }

    // Final analysis
    console.log('='.repeat(80));
    console.log('🔍 ANALYSIS:');
    console.log('='.repeat(80));

    if (emotionRecords.length > 0 && attendanceRecords.length === 0) {
      console.log('❌ CRITICAL ISSUE IDENTIFIED:');
      console.log('   - Emotion tracking is WORKING (socket emotion-update events received)');
      console.log('   - Attendance tracking is BROKEN (no join-meeting events or saves)\n');
      console.log('💡 ROOT CAUSES TO CHECK:');
      console.log('   1. Socket "join-meeting" event not being emitted from frontend');
      console.log('   2. Backend not receiving "join-meeting" event');
      console.log('   3. Attendance.save() failing silently');
      console.log('   4. Student ID mismatch or validation error\n');
      console.log('📝 NEXT STEPS:');
      console.log('   1. Check browser console for socket connection logs');
      console.log('   2. Check backend console for "JOIN-MEETING EVENT RECEIVED"');
      console.log('   3. Look for any error messages in backend logs');
      console.log('   4. Try the test-attendance-socket.js script');
    } else if (attendanceRecords.length > 0 && emotionRecords.length > 0) {
      console.log('✅ Both systems are working correctly!');
    } else if (attendanceRecords.length === 0 && emotionRecords.length === 0) {
      console.log('⚠️  No records for either system.');
      console.log('   Student may not have joined this meeting yet.');
    } else {
      console.log('⚠️  Unexpected state - attendance exists but no emotions.');
    }

    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

diagnoseAttendance();
