const Attendance = require('../models/Attendance');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const Batch = require('../models/Batch');

class AttendanceService {
  /**
   * Generate detailed attendance report for a meeting
   */
  static async generateMeetingReport(meetingId) {
    try {
      const meeting = await Meeting.findById(meetingId)
        .populate('departmentId', 'name code')
        .populate('courseId', 'name code')
        .populate('batchId', 'name year')
        .populate('semesterId', 'name number')
        .populate('subjectId', 'name code')
        .populate('lecturerId', 'firstName lastName email');

      if (!meeting) {
        throw new Error('Meeting not found');
      }

      const attendances = await Attendance.find({ meetingId })
        .populate('studentId', 'firstName lastName email rollNumber')
        .sort({ firstJoinTime: 1 });

      // Calculate meeting duration
      let meetingDuration = 0;
      if (meeting.startedAt) {
        const endTime = meeting.endedAt || new Date();
        meetingDuration = Math.floor((endTime - meeting.startedAt) / 1000);
      }

      // Statistics
      const totalStudents = attendances.length;
      const presentCount = attendances.filter(a => a.status === 'present').length;
      const lateCount = attendances.filter(a => a.status === 'late').length;
      const partialCount = attendances.filter(a => a.status === 'partial').length;
      const absentCount = attendances.filter(a => a.status === 'absent').length;

      const averageAttendancePercentage = totalStudents > 0
        ? attendances.reduce((sum, a) => sum + a.attendancePercentage, 0) / totalStudents
        : 0;

      const averageDuration = totalStudents > 0
        ? attendances.reduce((sum, a) => sum + a.totalDuration, 0) / totalStudents
        : 0;

      return {
        meeting: {
          id: meeting._id,
          topic: meeting.topic,
          description: meeting.description,
          department: meeting.departmentId,
          course: meeting.courseId,
          batch: meeting.batchId,
          semester: meeting.semesterId,
          subject: meeting.subjectId,
          lecturer: meeting.lecturerId,
          meetingDate: meeting.meetingDate,
          scheduledStartTime: meeting.startTime,
          scheduledEndTime: meeting.endTime,
          actualStartTime: meeting.startedAt,
          actualEndTime: meeting.endedAt,
          status: meeting.status,
          duration: meetingDuration
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
          averageAttendancePercentage: Math.round(averageAttendancePercentage * 100) / 100,
          averageDuration: Math.round(averageDuration)
        },
        attendances: attendances.map(a => ({
          id: a._id,
          student: {
            id: a.studentId._id,
            name: `${a.studentId.firstName} ${a.studentId.lastName}`,
            email: a.studentId.email,
            rollNumber: a.studentId.rollNumber
          },
          status: a.status,
          firstJoinTime: a.firstJoinTime,
          lastLeaveTime: a.lastLeaveTime,
          totalDuration: a.totalDuration,
          attendancePercentage: a.attendancePercentage,
          sessionCount: a.sessions.length,
          rejoinCount: a.rejoinCount,
          isLate: a.isLate,
          sessions: a.sessions
        }))
      };
    } catch (error) {
      throw new Error(`Failed to generate meeting report: ${error.message}`);
    }
  }

  /**
   * Generate attendance report for a student
   */
  static async generateStudentReport(studentId, filters = {}) {
    try {
      const student = await User.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      // Build query
      const query = { studentId };
      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }

      const attendances = await Attendance.find(query)
        .populate({
          path: 'meetingId',
          populate: {
            path: 'subjectId',
            select: 'name code'
          }
        })
        .sort({ createdAt: -1 });

      // Filter by subject if provided
      let filteredAttendances = attendances;
      if (filters.subjectId) {
        filteredAttendances = attendances.filter(a =>
          a.meetingId && a.meetingId.subjectId &&
          a.meetingId.subjectId._id.toString() === filters.subjectId
        );
      }

      // Calculate statistics
      const totalMeetings = filteredAttendances.length;
      const presentCount = filteredAttendances.filter(a => a.status === 'present').length;
      const lateCount = filteredAttendances.filter(a => a.status === 'late').length;
      const partialCount = filteredAttendances.filter(a => a.status === 'partial').length;
      const absentCount = filteredAttendances.filter(a => a.status === 'absent').length;

      const averageAttendancePercentage = totalMeetings > 0
        ? filteredAttendances.reduce((sum, a) => sum + a.attendancePercentage, 0) / totalMeetings
        : 0;

      const totalDuration = filteredAttendances.reduce((sum, a) => sum + a.totalDuration, 0);
      const totalRejoinCount = filteredAttendances.reduce((sum, a) => sum + a.rejoinCount, 0);

      return {
        student: {
          id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          rollNumber: student.rollNumber
        },
        period: {
          startDate: filters.startDate,
          endDate: filters.endDate
        },
        statistics: {
          totalMeetings,
          presentCount,
          lateCount,
          partialCount,
          absentCount,
          attendanceRate: totalMeetings > 0
            ? Math.round(((presentCount + lateCount) / totalMeetings) * 100 * 100) / 100
            : 0,
          averageAttendancePercentage: Math.round(averageAttendancePercentage * 100) / 100,
          totalDuration,
          totalRejoinCount
        },
        attendances: filteredAttendances.map(a => ({
          id: a._id,
          meeting: a.meetingId ? {
            id: a.meetingId._id,
            topic: a.meetingId.topic,
            subject: a.meetingId.subjectId,
            meetingDate: a.meetingId.meetingDate
          } : null,
          status: a.status,
          firstJoinTime: a.firstJoinTime,
          lastLeaveTime: a.lastLeaveTime,
          totalDuration: a.totalDuration,
          attendancePercentage: a.attendancePercentage,
          sessionCount: a.sessions.length,
          isLate: a.isLate
        }))
      };
    } catch (error) {
      throw new Error(`Failed to generate student report: ${error.message}`);
    }
  }

  /**
   * Generate batch attendance overview
   */
  static async generateBatchOverview(batchId, filters = {}) {
    try {
      const batch = await Batch.findById(batchId)
        .populate('departmentId', 'name code')
        .populate('courseId', 'name code');

      if (!batch) {
        throw new Error('Batch not found');
      }

      // Get all meetings for this batch
      const meetingQuery = { 
        batchId,
        isActive: true
      };

      if (filters.startDate && filters.endDate) {
        meetingQuery.meetingDate = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }

      if (filters.subjectId) {
        meetingQuery.subjectId = filters.subjectId;
      }

      const meetings = await Meeting.find(meetingQuery)
        .populate('subjectId', 'name code')
        .sort({ meetingDate: -1 });

      // Get all students in batch
      const students = await User.find({
        role: 'student',
        batchId: batchId,
        isActive: true
      }).select('firstName lastName email rollNumber');

      // Get attendance for all meetings
      const meetingIds = meetings.map(m => m._id);
      const attendances = await Attendance.find({ meetingId: { $in: meetingIds } });

      // Build overview by student
      const studentOverview = students.map(student => {
        const studentAttendances = attendances.filter(
          a => a.studentId.toString() === student._id.toString()
        );

        const totalMeetings = meetings.length;
        const attendedMeetings = studentAttendances.length;
        const presentCount = studentAttendances.filter(a => a.status === 'present').length;
        const lateCount = studentAttendances.filter(a => a.status === 'late').length;

        return {
          student: {
            id: student._id,
            name: `${student.firstName} ${student.lastName}`,
            email: student.email,
            rollNumber: student.rollNumber
          },
          totalMeetings,
          attendedMeetings,
          presentCount,
          lateCount,
          absentCount: totalMeetings - attendedMeetings,
          attendanceRate: totalMeetings > 0
            ? Math.round(((presentCount + lateCount) / totalMeetings) * 100 * 100) / 100
            : 0
        };
      });

      // Overall batch statistics
      const totalMeetingsCount = meetings.length;
      const totalStudentsCount = students.length;
      const totalPossibleAttendances = totalMeetingsCount * totalStudentsCount;
      const totalActualAttendances = attendances.length;

      return {
        batch: {
          id: batch._id,
          name: batch.name,
          year: batch.year,
          department: batch.departmentId,
          course: batch.courseId
        },
        period: {
          startDate: filters.startDate,
          endDate: filters.endDate
        },
        statistics: {
          totalMeetings: totalMeetingsCount,
          totalStudents: totalStudentsCount,
          overallAttendanceRate: totalPossibleAttendances > 0
            ? Math.round((totalActualAttendances / totalPossibleAttendances) * 100 * 100) / 100
            : 0
        },
        meetings: meetings.map(m => ({
          id: m._id,
          topic: m.topic,
          subject: m.subjectId,
          meetingDate: m.meetingDate,
          status: m.status,
          attendanceCount: attendances.filter(
            a => a.meetingId.toString() === m._id.toString()
          ).length
        })),
        studentOverview
      };
    } catch (error) {
      throw new Error(`Failed to generate batch overview: ${error.message}`);
    }
  }

  /**
   * Format duration in human-readable format
   */
  static formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }

  /**
   * Export attendance to CSV format
   */
  static async exportMeetingToCSV(meetingId) {
    try {
      const report = await this.generateMeetingReport(meetingId);

      const headers = [
        'Student Name',
        'Roll Number',
        'Email',
        'Status',
        'First Join Time',
        'Last Leave Time',
        'Total Duration',
        'Attendance %',
        'Sessions',
        'Rejoins',
        'Late'
      ];

      const rows = report.attendances.map(a => [
        a.student.name,
        a.student.rollNumber || 'N/A',
        a.student.email,
        a.status,
        a.firstJoinTime ? new Date(a.firstJoinTime).toLocaleString() : 'N/A',
        a.lastLeaveTime ? new Date(a.lastLeaveTime).toLocaleString() : 'N/A',
        this.formatDuration(a.totalDuration),
        `${a.attendancePercentage}%`,
        a.sessionCount,
        a.rejoinCount,
        a.isLate ? 'Yes' : 'No'
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return csv;
    } catch (error) {
      throw new Error(`Failed to export to CSV: ${error.message}`);
    }
  }
}

module.exports = AttendanceService;
