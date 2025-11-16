const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const auth = require('../middleware/auth');
const AttendanceService = require('../services/attendanceService');

/**
 * @route   POST /api/attendance/join
 * @desc    Record student joining a meeting
 * @access  Private (Student)
 */
router.post('/join', auth, async (req, res) => {
  try {
    const { meetingId } = req.body;
    const studentId = req.user.id;

    if (!meetingId) {
      return res.status(400).json({
        success: false,
        message: 'Meeting ID is required'
      });
    }

    // Verify meeting exists and is ongoing
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Get student details
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Find or create attendance record
    let attendance = await Attendance.findOne({ meetingId, studentId });

    if (!attendance) {
      // Create new attendance record
      attendance = new Attendance({
        meetingId,
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        studentEmail: student.email,
        sessions: []
      });
    }

    // Record join time
    const joinTime = new Date();
    const joined = attendance.recordJoin(joinTime);

    if (!joined) {
      return res.status(400).json({
        success: false,
        message: 'Student is already marked as present in an active session'
      });
    }

    // Check if late
    attendance.checkLateArrival(meeting.startTime, 5); // 5 minute grace period

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Attendance recorded - joined meeting',
      attendance: {
        meetingId: attendance.meetingId,
        studentId: attendance.studentId,
        joinTime: joinTime,
        sessionCount: attendance.sessions.length,
        isLate: attendance.isLate,
        status: attendance.status
      }
    });
  } catch (error) {
    console.error('Error recording join:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record attendance',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/attendance/leave
 * @desc    Record student leaving a meeting
 * @access  Private (Student)
 */
router.post('/leave', auth, async (req, res) => {
  try {
    const { meetingId } = req.body;
    const studentId = req.user.id;

    if (!meetingId) {
      return res.status(400).json({
        success: false,
        message: 'Meeting ID is required'
      });
    }

    // Find attendance record
    const attendance = await Attendance.findOne({ meetingId, studentId });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No attendance record found'
      });
    }

    // Record leave time
    const leaveTime = new Date();
    const left = attendance.recordLeave(leaveTime);

    if (!left) {
      return res.status(400).json({
        success: false,
        message: 'No active session found to close'
      });
    }

    // Get meeting to calculate attendance percentage
    const meeting = await Meeting.findById(meetingId);
    if (meeting && meeting.startedAt) {
      const meetingDuration = meeting.endedAt 
        ? Math.floor((meeting.endedAt - meeting.startedAt) / 1000)
        : Math.floor((new Date() - meeting.startedAt) / 1000);
      
      attendance.calculateAttendancePercentage(meetingDuration);
      
      // Update status based on percentage
      if (attendance.attendancePercentage < 50) {
        attendance.status = 'partial';
      }
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Attendance recorded - left meeting',
      attendance: {
        meetingId: attendance.meetingId,
        studentId: attendance.studentId,
        leaveTime: leaveTime,
        totalDuration: attendance.totalDuration,
        attendancePercentage: attendance.attendancePercentage,
        status: attendance.status
      }
    });
  } catch (error) {
    console.error('Error recording leave:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record leave',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/attendance/meeting/:meetingId
 * @desc    Get all attendance records for a meeting (Admin/Lecturer)
 * @access  Private (Admin/Lecturer)
 */
router.get('/meeting/:meetingId', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;

    // Verify meeting exists
    const meeting = await Meeting.findById(meetingId)
      .populate('subjectId', 'name code')
      .populate('lecturerId', 'firstName lastName email');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check authorization
    if (req.user.role === 'teacher' && meeting.lecturerId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this attendance'
      });
    }

    // Get all attendance records
    const attendances = await Attendance.getMeetingAttendance(meetingId);

    // Calculate meeting statistics
    const totalStudents = attendances.length;
    const presentCount = attendances.filter(a => a.status === 'present').length;
    const lateCount = attendances.filter(a => a.status === 'late').length;
    const partialCount = attendances.filter(a => a.status === 'partial').length;
    const absentCount = attendances.filter(a => a.status === 'absent').length;

    const averageAttendancePercentage = totalStudents > 0
      ? attendances.reduce((sum, a) => sum + a.attendancePercentage, 0) / totalStudents
      : 0;

    res.status(200).json({
      success: true,
      meeting: {
        id: meeting._id,
        topic: meeting.topic,
        subject: meeting.subjectId,
        lecturer: meeting.lecturerId,
        meetingDate: meeting.meetingDate,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        startedAt: meeting.startedAt,
        endedAt: meeting.endedAt,
        status: meeting.status
      },
      statistics: {
        totalStudents,
        presentCount,
        lateCount,
        partialCount,
        absentCount,
        attendanceRate: totalStudents > 0 
          ? Math.round(((presentCount + lateCount) / totalStudents) * 100 * 100) / 100
          : 0,
        averageAttendancePercentage: Math.round(averageAttendancePercentage * 100) / 100
      },
      attendances
    });
  } catch (error) {
    console.error('Error fetching meeting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meeting attendance',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/attendance/student/:studentId
 * @desc    Get attendance history for a student
 * @access  Private (Admin/Lecturer/Student)
 */
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, subjectId } = req.query;

    // Authorization check
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own attendance'
      });
    }

    // Build filters
    const filters = {};
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }

    // Get attendance history
    let attendances = await Attendance.getStudentAttendance(studentId, filters);

    // Filter by subject if provided
    if (subjectId) {
      attendances = attendances.filter(a => 
        a.meetingId && a.meetingId.subjectId && 
        a.meetingId.subjectId.toString() === subjectId
      );
    }

    // Get statistics
    const statistics = await Attendance.getStudentStatistics(studentId);

    res.status(200).json({
      success: true,
      studentId,
      statistics,
      count: attendances.length,
      attendances
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student attendance',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/attendance/admin/overview
 * @desc    Get attendance overview for admin panel
 * @access  Private (Admin only)
 */
router.get('/admin/overview', auth, async (req, res) => {
  try {
    // Check admin authorization
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { departmentId, courseId, batchId, semesterId, startDate, endDate } = req.query;

    // Build meeting query
    const meetingQuery = { isActive: true };
    if (departmentId) meetingQuery.departmentId = departmentId;
    if (courseId) meetingQuery.courseId = courseId;
    if (batchId) meetingQuery.batchId = batchId;
    if (semesterId) meetingQuery.semesterId = semesterId;
    if (startDate && endDate) {
      meetingQuery.meetingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get meetings
    const meetings = await Meeting.find(meetingQuery)
      .populate('departmentId', 'name code')
      .populate('courseId', 'name code')
      .populate('batchId', 'name year')
      .populate('semesterId', 'name number')
      .populate('subjectId', 'name code')
      .populate('lecturerId', 'firstName lastName')
      .sort({ meetingDate: -1 });

    // Get attendance for these meetings
    const meetingIds = meetings.map(m => m._id);
    const attendances = await Attendance.find({ meetingId: { $in: meetingIds } });

    // Build overview data
    const overview = meetings.map(meeting => {
      const meetingAttendances = attendances.filter(
        a => a.meetingId.toString() === meeting._id.toString()
      );

      const totalStudents = meetingAttendances.length;
      const presentCount = meetingAttendances.filter(a => a.status === 'present').length;
      const lateCount = meetingAttendances.filter(a => a.status === 'late').length;
      const partialCount = meetingAttendances.filter(a => a.status === 'partial').length;
      const absentCount = meetingAttendances.filter(a => a.status === 'absent').length;

      return {
        meeting: {
          id: meeting._id,
          topic: meeting.topic,
          department: meeting.departmentId,
          course: meeting.courseId,
          batch: meeting.batchId,
          semester: meeting.semesterId,
          subject: meeting.subjectId,
          lecturer: meeting.lecturerId,
          meetingDate: meeting.meetingDate,
          startTime: meeting.startTime,
          status: meeting.status
        },
        attendance: {
          totalStudents,
          presentCount,
          lateCount,
          partialCount,
          absentCount,
          attendanceRate: totalStudents > 0
            ? Math.round(((presentCount + lateCount) / totalStudents) * 100 * 100) / 100
            : 0
        }
      };
    });

    res.status(200).json({
      success: true,
      count: overview.length,
      overview
    });
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance overview',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/attendance/:attendanceId/details
 * @desc    Get detailed session information for an attendance record
 * @access  Private (Admin/Lecturer)
 */
router.get('/:attendanceId/details', auth, async (req, res) => {
  try {
    const { attendanceId } = req.params;

    const attendance = await Attendance.findById(attendanceId)
      .populate('studentId', 'firstName lastName email rollNumber')
      .populate({
        path: 'meetingId',
        populate: {
          path: 'subjectId lecturerId',
          select: 'name code firstName lastName'
        }
      });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Check authorization
    if (req.user.role === 'teacher') {
      const meeting = await Meeting.findById(attendance.meetingId);
      if (meeting.lecturerId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this attendance'
        });
      }
    }

    res.status(200).json({
      success: true,
      attendance: {
        id: attendance._id,
        student: attendance.studentId,
        meeting: attendance.meetingId,
        status: attendance.status,
        firstJoinTime: attendance.firstJoinTime,
        lastLeaveTime: attendance.lastLeaveTime,
        totalDuration: attendance.totalDuration,
        attendancePercentage: attendance.attendancePercentage,
        rejoinCount: attendance.rejoinCount,
        isLate: attendance.isLate,
        sessions: attendance.sessions.map(session => ({
          id: session._id,
          joinTime: session.joinTime,
          leaveTime: session.leaveTime,
          duration: session.duration,
          isActive: session.isActive
        })),
        notes: attendance.notes
      }
    });
  } catch (error) {
    console.error('Error fetching attendance details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance details',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/attendance/:attendanceId/notes
 * @desc    Add or update notes for an attendance record
 * @access  Private (Admin/Lecturer)
 */
router.put('/:attendanceId/notes', auth, async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { notes } = req.body;

    const attendance = await Attendance.findById(attendanceId);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Check authorization
    if (req.user.role === 'teacher') {
      const meeting = await Meeting.findById(attendance.meetingId);
      if (meeting.lecturerId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this attendance'
        });
      }
    }

    attendance.notes = notes;
    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Notes updated successfully',
      attendance
    });
  } catch (error) {
    console.error('Error updating notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notes',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/attendance/meeting/:meetingId/finalize
 * @desc    Finalize attendance for a meeting (mark absent students)
 * @access  Private (Lecturer/Admin)
 */
router.post('/meeting/:meetingId/finalize', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check authorization
    if (req.user.role === 'teacher' && meeting.lecturerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to finalize this meeting attendance'
      });
    }

    // Close all active sessions
    const attendances = await Attendance.find({ meetingId, isCurrentlyPresent: true });
    
    for (const attendance of attendances) {
      attendance.recordLeave(new Date());
      
      // Calculate final attendance percentage
      if (meeting.startedAt) {
        const meetingDuration = meeting.endedAt 
          ? Math.floor((meeting.endedAt - meeting.startedAt) / 1000)
          : Math.floor((new Date() - meeting.startedAt) / 1000);
        
        attendance.calculateAttendancePercentage(meetingDuration);
        
        if (attendance.attendancePercentage < 50) {
          attendance.status = 'partial';
        }
      }
      
      await attendance.save();
    }

    res.status(200).json({
      success: true,
      message: 'Attendance finalized successfully',
      closedSessions: attendances.length
    });
  } catch (error) {
    console.error('Error finalizing attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to finalize attendance',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/attendance/reports/meeting/:meetingId
 * @desc    Get detailed attendance report for a meeting
 * @access  Private (Admin/Lecturer)
 */
router.get('/reports/meeting/:meetingId', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check authorization
    if (req.user.role === 'teacher' && meeting.lecturerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this report'
      });
    }

    const report = await AttendanceService.generateMeetingReport(meetingId);

    res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error generating meeting report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate meeting report',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/attendance/reports/student/:studentId
 * @desc    Get detailed attendance report for a student
 * @access  Private (Admin/Lecturer/Student)
 */
router.get('/reports/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, subjectId } = req.query;

    // Authorization check
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own attendance report'
      });
    }

    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (subjectId) filters.subjectId = subjectId;

    const report = await AttendanceService.generateStudentReport(studentId, filters);

    res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error generating student report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate student report',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/attendance/reports/batch/:batchId
 * @desc    Get batch attendance overview
 * @access  Private (Admin/Lecturer)
 */
router.get('/reports/batch/:batchId', auth, async (req, res) => {
  try {
    const { batchId } = req.params;
    const { startDate, endDate, subjectId } = req.query;

    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (subjectId) filters.subjectId = subjectId;

    const overview = await AttendanceService.generateBatchOverview(batchId, filters);

    res.status(200).json({
      success: true,
      overview
    });
  } catch (error) {
    console.error('Error generating batch overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate batch overview',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/attendance/export/meeting/:meetingId/csv
 * @desc    Export meeting attendance to CSV
 * @access  Private (Admin/Lecturer)
 */
router.get('/export/meeting/:meetingId/csv', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check authorization
    if (req.user.role === 'teacher' && meeting.lecturerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to export this attendance'
      });
    }

    const csv = await AttendanceService.exportMeetingToCSV(meetingId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-${meetingId}.csv`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export attendance',
      error: error.message
    });
  }
});

module.exports = router;
