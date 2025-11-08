const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Meeting = require('../models/Meeting');
const Module = require('../models/Module');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const User = require('../models/User');

// @route   GET /api/lecturer/dashboard-stats/:lecturerId
// @desc    Get lecturer dashboard statistics (subjects, batches, courses, assignments, meetings)
// @access  Private (Lecturer)
router.get('/dashboard-stats/:lecturerId', async (req, res) => {
  try {
    const { lecturerId } = req.params;
    console.log(`📊 [LECTURER] Fetching dashboard stats for lecturer: ${lecturerId}`);

    // Get all subjects taught by this lecturer
    const subjects = await Subject.find({ 
      lecturerId: lecturerId, 
      isActive: true 
    }).populate(['departmentId', 'courseId', 'batchId', 'semesterId']);

    if (!subjects || subjects.length === 0) {
      return res.json({
        success: true,
        data: {
          subjectCount: 0,
          batchCount: 0,
          courseCount: 0,
          assignmentStats: { total: 0, pending: 0, completed: 0 },
          meetingStats: { total: 0, scheduled: 0, ongoing: 0, completed: 0 },
          subjects: []
        }
      });
    }

    const subjectIds = subjects.map(s => s._id);
    
    // Get unique batches and courses from subjects
    const uniqueBatchIds = [...new Set(subjects.map(s => s.batchId._id.toString()))];
    const uniqueCourseIds = [...new Set(subjects.map(s => s.courseId._id.toString()))];

    // Get assignments for these subjects
    const assignments = await Assignment.find({ 
      subject: { $in: subjectIds },
      isActive: true 
    });

    const assignmentIds = assignments.map(a => a._id);

    // Get assignment submissions to calculate pending/completed
    const submissions = await AssignmentSubmission.find({
      assignmentId: { $in: assignmentIds }
    });

    // Calculate assignment statistics
    const totalAssignments = assignments.length;
    const now = new Date();
    
    // Pending: assignments where due date hasn't passed and not all students submitted
    const pendingAssignments = assignments.filter(a => {
      const dueDate = new Date(a.dueDate);
      return dueDate >= now;
    }).length;

    // Completed: assignments where due date has passed
    const completedAssignments = assignments.filter(a => {
      const dueDate = new Date(a.dueDate);
      return dueDate < now;
    }).length;

    // Get meetings for these subjects
    const meetings = await Meeting.find({
      subjectId: { $in: subjectIds },
      isActive: true
    });

    // Calculate meeting statistics
    const totalMeetings = meetings.length;
    const scheduledMeetings = meetings.filter(m => m.status === 'scheduled').length;
    const ongoingMeetings = meetings.filter(m => m.status === 'ongoing').length;
    const completedMeetings = meetings.filter(m => m.status === 'completed').length;

    const dashboardStats = {
      subjectCount: subjects.length,
      batchCount: uniqueBatchIds.length,
      courseCount: uniqueCourseIds.length,
      assignmentStats: {
        total: totalAssignments,
        pending: pendingAssignments,
        completed: completedAssignments
      },
      meetingStats: {
        total: totalMeetings,
        scheduled: scheduledMeetings,
        ongoing: ongoingMeetings,
        completed: completedMeetings
      },
      subjects: subjects.map(s => ({
        _id: s._id,
        name: s.name,
        code: s.code,
        department: s.departmentId?.name || '',
        course: s.courseId?.name || '',
        batch: s.batchId?.name || '',
        semester: s.semesterId?.name || ''
      }))
    };

    console.log(`✅ [LECTURER] Dashboard stats fetched successfully`);
    console.log(`   📚 Subjects: ${dashboardStats.subjectCount}`);
    console.log(`   👥 Batches: ${dashboardStats.batchCount}`);
    console.log(`   📖 Courses: ${dashboardStats.courseCount}`);
    console.log(`   📝 Assignments - Total: ${totalAssignments}, Pending: ${pendingAssignments}, Completed: ${completedAssignments}`);
    console.log(`   🎥 Meetings - Total: ${totalMeetings}, Scheduled: ${scheduledMeetings}, Completed: ${completedMeetings}`);

    res.json({
      success: true,
      data: dashboardStats
    });

  } catch (error) {
    console.error('❌ [LECTURER] Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lecturer dashboard statistics',
      error: error.message
    });
  }
});

// @route   GET /api/lecturer/subject-details/:lecturerId
// @desc    Get detailed information for each subject (modules, assignments, students, meetings)
// @access  Private (Lecturer)
router.get('/subject-details/:lecturerId', async (req, res) => {
  try {
    const { lecturerId } = req.params;
    console.log(`📊 [LECTURER] Fetching subject details for lecturer: ${lecturerId}`);

    // Get all subjects taught by this lecturer
    const subjects = await Subject.find({ 
      lecturerId: lecturerId, 
      isActive: true 
    }).populate(['departmentId', 'courseId', 'batchId', 'semesterId']);

    if (!subjects || subjects.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Build detailed information for each subject
    const subjectDetails = await Promise.all(
      subjects.map(async (subject) => {
        // Get module count for this subject
        const moduleCount = await Module.countDocuments({
          subject: subject._id,
          isActive: true
        });

        // Get assignment count for this subject
        const assignmentCount = await Assignment.countDocuments({
          subject: subject._id,
          isActive: true
        });

        // Get meeting count for this subject
        const meetingCount = await Meeting.countDocuments({
          subjectId: subject._id,
          isActive: true
        });

        // Get student count from batch (maxStudents capacity)
        // batchId is already populated, so we can access maxStudents directly
        console.log(`🔍 [DEBUG] Subject: ${subject.name}, Batch:`, {
          batchId: subject.batchId?._id,
          batchName: subject.batchId?.name,
          maxStudents: subject.batchId?.maxStudents
        });
        const studentCount = subject.batchId?.maxStudents || 0;

        // Get assignment breakdown (pending/completed)
        const assignments = await Assignment.find({
          subject: subject._id,
          isActive: true
        });

        const now = new Date();
        const pendingAssignments = assignments.filter(a => new Date(a.dueDate) >= now).length;
        const completedAssignments = assignments.filter(a => new Date(a.dueDate) < now).length;

        // Get meeting breakdown (scheduled/ongoing/completed)
        const meetings = await Meeting.find({
          subjectId: subject._id,
          isActive: true
        });

        const scheduledMeetings = meetings.filter(m => m.status === 'scheduled').length;
        const ongoingMeetings = meetings.filter(m => m.status === 'ongoing').length;
        const completedMeetings = meetings.filter(m => m.status === 'completed').length;

        return {
          _id: subject._id,
          name: subject.name,
          code: subject.code,
          description: subject.description || '',
          department: {
            _id: subject.departmentId._id,
            name: subject.departmentId.name,
            code: subject.departmentId.code
          },
          course: {
            _id: subject.courseId._id,
            name: subject.courseId.name,
            code: subject.courseId.code
          },
          batch: {
            _id: subject.batchId._id,
            name: subject.batchId.name,
            code: subject.batchId.code,
            startYear: subject.batchId.startYear,
            endYear: subject.batchId.endYear
          },
          semester: {
            _id: subject.semesterId._id,
            name: subject.semesterId.name
          },
          creditHours: subject.creditHours,
          statistics: {
            moduleCount,
            assignmentCount,
            meetingCount,
            studentCount,
            assignmentBreakdown: {
              total: assignmentCount,
              pending: pendingAssignments,
              completed: completedAssignments
            },
            meetingBreakdown: {
              total: meetingCount,
              scheduled: scheduledMeetings,
              ongoing: ongoingMeetings,
              completed: completedMeetings
            }
          }
        };
      })
    );

    console.log(`✅ [LECTURER] Subject details fetched for ${subjectDetails.length} subjects`);

    res.json({
      success: true,
      data: subjectDetails
    });

  } catch (error) {
    console.error('❌ [LECTURER] Error fetching subject details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subject details',
      error: error.message
    });
  }
});

// @route   GET /api/lecturer/subject/:subjectId/details
// @desc    Get detailed information for a single subject
// @access  Private (Lecturer)
router.get('/subject/:subjectId/details', async (req, res) => {
  try {
    const { subjectId } = req.params;
    console.log(`📊 [LECTURER] Fetching details for subject: ${subjectId}`);

    const subject = await Subject.findById(subjectId)
      .populate(['departmentId', 'courseId', 'batchId', 'semesterId', 'lecturerId']);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Get modules
    const modules = await Module.find({
      subject: subjectId,
      isActive: true
    }).sort({ order: 1 });

    // Get assignments
    const assignments = await Assignment.find({
      subject: subjectId,
      isActive: true
    }).sort({ dueDate: -1 });

    // Get meetings
    const meetings = await Meeting.find({
      subjectId: subjectId,
      isActive: true
    }).sort({ meetingDate: -1 });

    // Get batch details with student count (maxStudents capacity)
    // batchId is already populated, so we can access maxStudents directly
    const studentCount = subject.batchId?.maxStudents || 0;

    const subjectDetail = {
      _id: subject._id,
      name: subject.name,
      code: subject.code,
      description: subject.description,
      creditHours: subject.creditHours,
      department: {
        _id: subject.departmentId._id,
        name: subject.departmentId.name,
        code: subject.departmentId.code
      },
      course: {
        _id: subject.courseId._id,
        name: subject.courseId.name,
        code: subject.courseId.code
      },
      batch: {
        _id: subject.batchId._id,
        name: subject.batchId.name,
        code: subject.batchId.code,
        startYear: subject.batchId.startYear,
        endYear: subject.batchId.endYear,
        currentEnrollment: studentCount
      },
      semester: {
        _id: subject.semesterId._id,
        name: subject.semesterId.name
      },
      lecturer: {
        _id: subject.lecturerId._id,
        firstName: subject.lecturerId.firstName,
        lastName: subject.lecturerId.lastName,
        email: subject.lecturerId.email
      },
      modules: modules.map(m => ({
        _id: m._id,
        name: m.name,
        code: m.code,
        title: m.title,
        description: m.description,
        order: m.order,
        documentCount: m.documents?.length || 0,
        hasVideo: !!m.video
      })),
      assignments: assignments.map(a => ({
        _id: a._id,
        title: a.title,
        dueDate: a.dueDate,
        assignmentType: a.assignmentType,
        assignmentLevel: a.assignmentLevel,
        maxMarks: a.maxMarks,
        numberOfQuestions: a.numberOfQuestions
      })),
      meetings: meetings.map(m => ({
        _id: m._id,
        topic: m.topic,
        meetingDate: m.meetingDate,
        startTime: m.startTime,
        endTime: m.endTime,
        status: m.status,
        studentCount: m.studentCount
      })),
      statistics: {
        moduleCount: modules.length,
        assignmentCount: assignments.length,
        meetingCount: meetings.length,
        studentCount: studentCount
      }
    };

    console.log(`✅ [LECTURER] Subject details fetched successfully`);

    res.json({
      success: true,
      data: subjectDetail
    });

  } catch (error) {
    console.error('❌ [LECTURER] Error fetching subject details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subject details',
      error: error.message
    });
  }
});

module.exports = router;
