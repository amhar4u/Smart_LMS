const express = require('express');
const router = express.Router();
const StudentEmotion = require('../models/StudentEmotion');
const Attendance = require('../models/Attendance');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Get comprehensive meeting analytics (Admin & Lecturer)
router.get('/meetings/:meetingId/analytics', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;

    // Fetch meeting details
    const meeting = await Meeting.findById(meetingId)
      .populate('lecturerId', 'firstName lastName email')
      .populate('subjectId', 'name code')
      .populate('batchId', 'name')
      .populate('departmentId', 'name');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Get all emotions for this meeting
    const emotions = await StudentEmotion.find({ meetingId })
      .populate('studentId', 'firstName lastName email rollNumber role');

    // Calculate overall emotion percentages
    const emotionTotals = {
      happy: 0,
      sad: 0,
      angry: 0,
      surprised: 0,
      fearful: 0,
      disgusted: 0,
      neutral: 0,
      unknown: 0
    };

    // 🎓 Educational state totals
    const educationalStateTotals = {
      engaged: 0,
      thinking: 0,
      interested: 0,
      confused: 0,
      bored: 0,
      frustrated: 0,
      distracted: 0,
      neutral: 0
    };

    // 📊 Behavioral aggregates
    let totalAttentionSpan = 0;
    let totalFocusScore = 0;
    let totalLookAways = 0;
    let recordsWithBehavior = 0;

    emotions.forEach(record => {
      const emotion = record.dominantEmotion ? record.dominantEmotion.toLowerCase() : 'unknown';
      emotionTotals[emotion] = (emotionTotals[emotion] || 0) + 1;

      // Track educational states
      if (record.dominantEducationalState) {
        const eduState = record.dominantEducationalState.toLowerCase();
        educationalStateTotals[eduState] = (educationalStateTotals[eduState] || 0) + 1;
      }

      // Aggregate behavioral data
      if (record.behavior) {
        totalAttentionSpan += record.behavior.attentionSpan || 0;
        totalFocusScore += record.behavior.focusScore || 0;
        totalLookAways += record.behavior.lookAwayCount || 0;
        recordsWithBehavior++;
      }
    });

    const totalRecords = emotions.length;
    const emotionPercentages = {};
    Object.keys(emotionTotals).forEach(emotion => {
      emotionPercentages[emotion] = totalRecords > 0
        ? Math.round((emotionTotals[emotion] / totalRecords) * 100)
        : 0;
    });

    // Calculate educational state percentages
    const educationalStatePercentages = {};
    Object.keys(educationalStateTotals).forEach(state => {
      educationalStatePercentages[state] = totalRecords > 0
        ? Math.round((educationalStateTotals[state] / totalRecords) * 100)
        : 0;
    });

    // Calculate overall behavioral averages
    const overallBehavior = {
      avgAttentionSpan: recordsWithBehavior > 0
        ? Math.round(totalAttentionSpan / recordsWithBehavior)
        : 0,
      avgFocusScore: recordsWithBehavior > 0
        ? Math.round(totalFocusScore / recordsWithBehavior)
        : 0,
      totalLookAways: totalLookAways,
      avgLookAwaysPerStudent: recordsWithBehavior > 0
        ? Math.round(totalLookAways / recordsWithBehavior)
        : 0
    };

    // Group by student for student-wise summary
    const studentEmotionMap = {};
    emotions.forEach(record => {
      if (!record.studentId) return; // Skip if student not found
      
      const studentId = record.studentId._id.toString();
      if (!studentEmotionMap[studentId]) {
        studentEmotionMap[studentId] = {
          studentId: record.studentId._id,
          studentName: `${record.studentId.firstName} ${record.studentId.lastName}`,
          email: record.studentId.email,
          rollNumber: record.studentId.rollNumber || 'N/A',
          role: record.studentId.role || 'student',
          emotionCounts: {
            happy: 0,
            sad: 0,
            angry: 0,
            surprised: 0,
            fearful: 0,
            disgusted: 0,
            neutral: 0,
            unknown: 0
          },
          educationalStateCounts: {
            engaged: 0,
            thinking: 0,
            interested: 0,
            confused: 0,
            bored: 0,
            frustrated: 0,
            distracted: 0,
            neutral: 0
          },
          totalRecords: 0,
          avgAttentiveness: 0,
          attentivenessSum: 0,
          behaviorSum: {
            attentionSpan: 0,
            focusScore: 0,
            lookAwayCount: 0
          },
          behaviorRecords: 0
        };
      }

      const emotion = record.dominantEmotion ? record.dominantEmotion.toLowerCase() : 'unknown';
      studentEmotionMap[studentId].emotionCounts[emotion]++;
      studentEmotionMap[studentId].totalRecords++;
      studentEmotionMap[studentId].attentivenessSum += record.attentiveness;

      // Track educational states per student
      if (record.dominantEducationalState) {
        const eduState = record.dominantEducationalState.toLowerCase();
        studentEmotionMap[studentId].educationalStateCounts[eduState]++;
      }

      // Track behavioral data per student
      if (record.behavior) {
        studentEmotionMap[studentId].behaviorSum.attentionSpan += record.behavior.attentionSpan || 0;
        studentEmotionMap[studentId].behaviorSum.focusScore += record.behavior.focusScore || 0;
        studentEmotionMap[studentId].behaviorSum.lookAwayCount += record.behavior.lookAwayCount || 0;
        studentEmotionMap[studentId].behaviorRecords++;
      }
    });

    // Calculate student-wise percentages and average attentiveness
    const studentSummaries = Object.values(studentEmotionMap).map(student => {
      const emotionPercentages = {};
      Object.keys(student.emotionCounts).forEach(emotion => {
        emotionPercentages[emotion] = student.totalRecords > 0
          ? Math.round((student.emotionCounts[emotion] / student.totalRecords) * 100)
          : 0;
      });

      // Calculate educational state percentages
      const educationalStatePercentages = {};
      Object.keys(student.educationalStateCounts).forEach(state => {
        educationalStatePercentages[state] = student.totalRecords > 0
          ? Math.round((student.educationalStateCounts[state] / student.totalRecords) * 100)
          : 0;
      });

      // Calculate behavioral averages
      const behaviorAvg = {
        attentionSpan: student.behaviorRecords > 0
          ? Math.round(student.behaviorSum.attentionSpan / student.behaviorRecords)
          : 0,
        focusScore: student.behaviorRecords > 0
          ? Math.round(student.behaviorSum.focusScore / student.behaviorRecords)
          : 0,
        lookAwayCount: student.behaviorRecords > 0
          ? Math.round(student.behaviorSum.lookAwayCount / student.behaviorRecords)
          : 0
      };

      return {
        studentId: student.studentId,
        studentName: student.studentName,
        email: student.email,
        rollNumber: student.rollNumber,
        role: student.role,
        emotionPercentages,
        dominantEmotion: Object.keys(student.emotionCounts).reduce((a, b) =>
          student.emotionCounts[a] > student.emotionCounts[b] ? a : b
        ),
        educationalStatePercentages,
        dominantEducationalState: Object.keys(student.educationalStateCounts).reduce((a, b) =>
          student.educationalStateCounts[a] > student.educationalStateCounts[b] ? a : b
        ),
        behavior: behaviorAvg,
        totalRecords: student.totalRecords,
        avgAttentiveness: student.totalRecords > 0
          ? Math.round((student.attentivenessSum / student.totalRecords) * 100)
          : 0
      };
    });

    // Get attendance data - includes both students and lecturers
    const attendanceRecords = await Attendance.find({ meetingId })
      .populate('studentId', 'firstName lastName email rollNumber role');

    console.log('\n📊 ATTENDANCE DEBUG:');
    console.log(`Total attendance records found: ${attendanceRecords.length}`);
    attendanceRecords.forEach((record, index) => {
      console.log(`\nRecord ${index + 1}:`);
      console.log(`  Student ID: ${record.studentId?._id || 'NULL'}`);
      console.log(`  Student Name: ${record.studentName}`);
      console.log(`  Status: ${record.status}`);
      console.log(`  Sessions: ${record.sessions.length}`);
      console.log(`  First Join: ${record.firstJoinTime}`);
      console.log(`  Total Duration: ${record.totalDuration}`);
    });

    // Filter out null studentId records and map properly
    const attendanceSummaries = attendanceRecords
      .filter(record => record.studentId) // Only include records with valid studentId
      .map(record => ({
        studentId: record.studentId._id,
        studentName: `${record.studentId.firstName} ${record.studentId.lastName}`,
        email: record.studentId.email,
        rollNumber: record.studentId.rollNumber || 'N/A',
        role: record.studentId.role || 'student',
        status: record.status,
        firstJoinTime: record.firstJoinTime,
        lastLeaveTime: record.lastLeaveTime,
        totalDuration: record.totalDuration,
        attendancePercentage: record.attendancePercentage,
        isLate: record.isLate,
        rejoinCount: record.rejoinCount,
        sessions: record.sessions
      }));

    console.log(`\nFiltered attendance summaries: ${attendanceSummaries.length}`);
    console.log('Attendance Summaries:', JSON.stringify(attendanceSummaries, null, 2));

    // Calculate meeting statistics
    const meetingDuration = meeting.endedAt && meeting.startedAt
      ? Math.floor((meeting.endedAt - meeting.startedAt) / 1000)
      : 0;

    const presentCount = attendanceRecords.filter(a => a.status === 'present' || a.status === 'late').length;
    const lateCount = attendanceRecords.filter(a => a.status === 'late').length;

    res.json({
      success: true,
      data: {
        meeting: {
          id: meeting._id,
          topic: meeting.topic,
          description: meeting.description,
          meetingDate: meeting.meetingDate,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          startedAt: meeting.startedAt,
          endedAt: meeting.endedAt,
          duration: meetingDuration,
          status: meeting.status,
          lecturer: meeting.lecturerId,
          subject: meeting.subjectId,
          batch: meeting.batchId,
          department: meeting.departmentId
        },
        emotionAnalytics: {
          overallEmotionPercentages: emotionPercentages,
          educationalStatePercentages: educationalStatePercentages,
          overallBehavior: overallBehavior,
          totalEmotionRecords: totalRecords,
          studentsTracked: Object.keys(studentEmotionMap).length,
          studentSummaries: studentSummaries.sort((a, b) =>
            a.studentName.localeCompare(b.studentName)
          )
        },
        attendanceAnalytics: {
          totalStudents: attendanceRecords.length,
          presentCount,
          lateCount,
          attendancePercentage: attendanceRecords.length > 0
            ? Math.round((presentCount / attendanceRecords.length) * 100)
            : 0,
          attendanceSummaries: attendanceSummaries.sort((a, b) =>
            a.studentName.localeCompare(b.studentName)
          )
        }
      }
    });
  } catch (error) {
    console.error('Error fetching meeting analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meeting analytics',
      error: error.message
    });
  }
});

// Get all meetings analytics for admin
router.get('/admin/meetings/analytics', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { startDate, endDate, departmentId, status } = req.query;
    
    // Build query
    const query = {};
    if (startDate && endDate) {
      query.meetingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (departmentId) query.departmentId = departmentId;
    if (status) query.status = status;

    const meetings = await Meeting.find(query)
      .populate('lecturerId', 'firstName lastName')
      .populate('subjectId', 'name code')
      .populate('batchId', 'name')
      .populate('departmentId', 'name')
      .sort({ meetingDate: -1 });

    // Get analytics for each meeting
    const meetingsWithAnalytics = await Promise.all(
      meetings.map(async (meeting) => {
        const emotionCount = await StudentEmotion.countDocuments({ meetingId: meeting._id });
        const attendanceCount = await Attendance.countDocuments({ meetingId: meeting._id });
        const presentCount = await Attendance.countDocuments({
          meetingId: meeting._id,
          status: { $in: ['present', 'late'] }
        });

        // Get emotion summary
        const emotions = await StudentEmotion.find({ meetingId: meeting._id });
        const emotionTotals = { happy: 0, sad: 0, angry: 0, neutral: 0, unknown: 0 };
        emotions.forEach(e => {
          emotionTotals[e.dominantEmotion] = (emotionTotals[e.dominantEmotion] || 0) + 1;
        });

        return {
          id: meeting._id,
          topic: meeting.topic,
          meetingDate: meeting.meetingDate,
          startTime: meeting.startTime,
          status: meeting.status,
          lecturer: meeting.lecturerId,
          subject: meeting.subjectId,
          batch: meeting.batchId,
          department: meeting.departmentId,
          analytics: {
            totalEmotionRecords: emotionCount,
            totalStudents: attendanceCount,
            presentCount,
            attendanceRate: attendanceCount > 0
              ? Math.round((presentCount / attendanceCount) * 100)
              : 0,
            emotionBreakdown: emotionTotals
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        meetings: meetingsWithAnalytics,
        totalMeetings: meetings.length
      }
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

// Get lecturer's meetings analytics
router.get('/lecturer/meetings/analytics', auth, async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const { startDate, endDate, status } = req.query;

    // Build query
    const query = { lecturerId };
    if (startDate && endDate) {
      query.meetingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (status) query.status = status;

    const meetings = await Meeting.find(query)
      .populate('subjectId', 'name code')
      .populate('batchId', 'name')
      .populate('departmentId', 'name')
      .sort({ meetingDate: -1 });

    // Get analytics for each meeting
    const meetingsWithAnalytics = await Promise.all(
      meetings.map(async (meeting) => {
        const emotionCount = await StudentEmotion.countDocuments({ meetingId: meeting._id });
        const attendanceCount = await Attendance.countDocuments({ meetingId: meeting._id });
        const presentCount = await Attendance.countDocuments({
          meetingId: meeting._id,
          status: { $in: ['present', 'late'] }
        });

        // Get emotion summary
        const emotions = await StudentEmotion.find({ meetingId: meeting._id });
        const emotionTotals = { happy: 0, sad: 0, angry: 0, neutral: 0, unknown: 0 };
        emotions.forEach(e => {
          emotionTotals[e.dominantEmotion] = (emotionTotals[e.dominantEmotion] || 0) + 1;
        });

        return {
          id: meeting._id,
          topic: meeting.topic,
          meetingDate: meeting.meetingDate,
          startTime: meeting.startTime,
          status: meeting.status,
          subject: meeting.subjectId,
          batch: meeting.batchId,
          department: meeting.departmentId,
          analytics: {
            totalEmotionRecords: emotionCount,
            totalStudents: attendanceCount,
            presentCount,
            attendanceRate: attendanceCount > 0
              ? Math.round((presentCount / attendanceCount) * 100)
              : 0,
            emotionBreakdown: emotionTotals
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        meetings: meetingsWithAnalytics,
        totalMeetings: meetings.length
      }
    });
  } catch (error) {
    console.error('Error fetching lecturer analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

module.exports = router;
