const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const Subject = require('../models/Subject');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Meeting = require('../models/Meeting');

// @route   GET /api/statistics/student-dashboard/:studentId
// @desc    Get comprehensive student dashboard statistics
// @access  Private (Student only)
router.get('/student-dashboard/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student details with populated fields
    const student = await User.findById(studentId)
      .populate('department', 'name')
      .populate('course', 'name')
      .populate('batch', 'name')
      .populate('semester', 'name')
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Extract IDs safely (handle both ObjectId and populated objects)
    const departmentId = student.department?._id || student.department;
    const courseId = student.course?._id || student.course;
    const batchId = student.batch?._id || student.batch;
    const semesterId = student.semester?._id || student.semester;

    // Check if student has required fields
    if (!batchId || !semesterId) {
      return res.json({
        success: true,
        data: {
          student: {
            name: `${student.firstName} ${student.lastName}`,
            email: student.email,
            department: student.department?.name || 'Not assigned',
            course: student.course?.name || 'Not assigned',
            batch: student.batch?.name || 'Not assigned',
            semester: student.semester?.name || 'Not assigned'
          },
          subjects: { total: 0, active: 0 },
          assignments: { total: 0, pending: 0, completed: 0, submissionRate: 0 },
          meetings: { total: 0, scheduled: 0, upcoming: 0, completed: 0 },
          upcomingAssignments: [],
          upcomingMeetings: []
        }
      });
    }

    // Get subjects for the student's batch and semester
    const subjects = await Subject.find({
      batchId: batchId,
      semesterId: semesterId,
      isActive: true
    }).lean();

    const subjectIds = subjects.map(s => s._id);

    // Get assignments for student's subjects
    const [
      totalAssignments,
      pendingAssignments,
      completedSubmissions,
      assignmentSubmissions
    ] = await Promise.all([
      Assignment.countDocuments({
        subject: { $in: subjectIds },
        isActive: true
      }),
      Assignment.countDocuments({
        subject: { $in: subjectIds },
        isActive: true,
        dueDate: { $gte: new Date() }
      }),
      AssignmentSubmission.countDocuments({
        studentId: studentId,
        status: 'completed'
      }),
      AssignmentSubmission.find({ studentId: studentId }).lean()
    ]);

    // Get meetings for student's batch and semester
    const [
      totalMeetings,
      scheduledMeetings,
      upcomingMeetings,
      completedMeetings
    ] = await Promise.all([
      Meeting.countDocuments({
        batchId: batchId,
        semesterId: semesterId
      }),
      Meeting.countDocuments({
        batchId: batchId,
        semesterId: semesterId,
        status: 'scheduled'
      }),
      Meeting.countDocuments({
        batchId: batchId,
        semesterId: semesterId,
        status: 'scheduled',
        meetingDate: { $gte: new Date() }
      }),
      Meeting.countDocuments({
        batchId: batchId,
        semesterId: semesterId,
        status: 'completed'
      })
    ]);

    // Get next 3 upcoming assignments
    const upcomingAssignmentsList = await Assignment.find({
      subject: { $in: subjectIds },
      isActive: true,
      dueDate: { $gte: new Date() }
    })
      .populate('subject', 'name code')
      .populate('modules', 'name')
      .sort({ dueDate: 1 })
      .limit(3)
      .select('title description subject modules totalMarks dueDate questionCount assignmentType assignmentLevel createdAt')
      .lean();

    // Get next 3 upcoming meetings
    const upcomingMeetingsList = await Meeting.find({
      batchId: batchId,
      semesterId: semesterId,
      meetingDate: { $gte: new Date() }
    })
      .populate('subjectId', 'name code')
      .populate('batchId', 'name')
      .populate('semesterId', 'name')
      .populate('moduleIds', 'name')
      .sort({ meetingDate: 1 })
      .limit(3)
      .select('topic description subjectId batchId semesterId moduleIds meetingDate startTime duration status roomUrl')
      .lean();

    const dashboardStats = {
      student: {
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        department: student.department?.name || 'N/A',
        course: student.course?.name || 'N/A',
        batch: student.batch?.name || 'N/A',
        semester: student.semester?.name || 'N/A'
      },
      subjects: {
        total: subjects.length,
        active: subjects.filter(s => s.isActive).length
      },
      assignments: {
        total: totalAssignments,
        pending: pendingAssignments,
        completed: completedSubmissions,
        submissionRate: totalAssignments > 0 ? Math.round((completedSubmissions / totalAssignments) * 100) : 0
      },
      meetings: {
        total: totalMeetings,
        scheduled: scheduledMeetings,
        upcoming: upcomingMeetings,
        completed: completedMeetings
      },
      upcomingAssignments: upcomingAssignmentsList.map(assignment => ({
        _id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        subject: assignment.subject,
        modules: assignment.modules,
        totalMarks: assignment.totalMarks,
        questionCount: assignment.questionCount,
        dueDate: assignment.dueDate,
        assignmentType: assignment.assignmentType,
        assignmentLevel: assignment.assignmentLevel,
        createdAt: assignment.createdAt,
        daysRemaining: Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
      })),
      upcomingMeetings: upcomingMeetingsList.map(meeting => ({
        _id: meeting._id,
        topic: meeting.topic,
        description: meeting.description,
        subject: meeting.subjectId,
        batch: meeting.batchId,
        semester: meeting.semesterId,
        modules: meeting.moduleIds,
        meetingDate: meeting.meetingDate,
        startTime: meeting.startTime,
        duration: meeting.duration,
        status: meeting.status,
        roomUrl: meeting.roomUrl
      }))}
    };

    res.json({
      success: true,
      data: dashboardStats
    });
  } catch (error) {
    console.error('❌ [STUDENT DASHBOARD] Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student dashboard statistics',
      error: error.message
    });
  }
});

// @route   GET /api/statistics/admin-dashboard
// @desc    Get comprehensive admin dashboard statistics
// @access  Private (Admin only)
router.get('/admin-dashboard', async (req, res) => {
  try {
    // Get all counts
    const [
      totalSubjects,
      activeSubjects,
      totalAssignments,
      activeAssignments,
      pendingAssignments,
      completedSubmissions,
      totalMeetings,
      scheduledMeetings,
      ongoingMeetings,
      completedMeetings
    ] = await Promise.all([
      Subject.countDocuments({}),
      Subject.countDocuments({ isActive: true }),
      Assignment.countDocuments({}),
      Assignment.countDocuments({ isActive: true }),
      Assignment.countDocuments({ 
        isActive: true,
        dueDate: { $gte: new Date() }
      }),
      AssignmentSubmission.countDocuments({ status: 'completed' }),
      Meeting.countDocuments({}),
      Meeting.countDocuments({ status: 'scheduled' }),
      Meeting.countDocuments({ status: 'ongoing' }),
      Meeting.countDocuments({ status: 'completed' })
    ]);

    // Get recent 3 assignments with populated data
    const recentAssignments = await Assignment.find({ isActive: true })
      .populate('subject', 'name code')
      .populate('modules', 'name')
      .populate('batch', 'name')
      .populate('semester', 'name')
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title description subject modules batch semester assignmentType assignmentLevel totalMarks dueDate questionCount createdAt')
      .lean();

    // Get recent 3 meetings with populated data
    const recentMeetings = await Meeting.find({})
      .populate('subjectId', 'name code')
      .populate('batchId', 'name')
      .populate('semesterId', 'name')
      .populate('moduleIds', 'name')
      .sort({ meetingDate: -1 })
      .limit(3)
      .select('topic description subjectId batchId semesterId moduleIds meetingDate startTime duration status roomUrl')
      .lean();

    const dashboardStats = {
      subjects: {
        total: totalSubjects,
        active: activeSubjects,
        inactive: totalSubjects - activeSubjects
      },
      assignments: {
        total: totalAssignments,
        active: activeAssignments,
        pending: pendingAssignments,
        completed: totalAssignments - pendingAssignments,
        submissions: completedSubmissions
      },
      meetings: {
        total: totalMeetings,
        scheduled: scheduledMeetings,
        ongoing: ongoingMeetings,
        completed: completedMeetings,
        cancelled: totalMeetings - (scheduledMeetings + ongoingMeetings + completedMeetings)
      },
      recentAssignments: recentAssignments.map(assignment => ({
        _id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        subject: assignment.subject,
        modules: assignment.modules,
        batch: assignment.batch,
        semester: assignment.semester,
        assignmentType: assignment.assignmentType,
        assignmentLevel: assignment.assignmentLevel,
        totalMarks: assignment.totalMarks,
        questionCount: assignment.questionCount,
        dueDate: assignment.dueDate,
        createdAt: assignment.createdAt,
        duration: assignment.dueDate ? Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
      })),
      recentMeetings: recentMeetings.map(meeting => ({
        _id: meeting._id,
        topic: meeting.topic,
        description: meeting.description,
        subject: meeting.subjectId,
        batch: meeting.batchId,
        semester: meeting.semesterId,
        modules: meeting.moduleIds,
        meetingDate: meeting.meetingDate,
        startTime: meeting.startTime,
        duration: meeting.duration,
        status: meeting.status,
        roomUrl: meeting.roomUrl
      }))}
    };

    res.json({
      success: true,
      data: dashboardStats
    });
  } catch (error) {
    console.error('❌ [ADMIN DASHBOARD] Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin dashboard statistics',
      error: error.message
    });
  }
});

// @route   GET /api/statistics
// @desc    Get overall platform statistics
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Get user counts with proper status filtering
    const totalUsers = await User.countDocuments({ isActive: true, status: 'approved' });
    const activeStudents = await User.countDocuments({ role: 'student', isActive: true, status: 'approved' });
    const expertTeachers = await User.countDocuments({ role: 'teacher', isActive: true, status: 'approved' });
    const admins = await User.countDocuments({ role: 'admin', isActive: true, status: 'approved' });
    
    // Get pending users count
    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const pendingStudents = await User.countDocuments({ role: 'student', status: 'pending' });
    const pendingTeachers = await User.countDocuments({ role: 'teacher', status: 'pending' });
    
    // Get rejected users count
    const rejectedUsers = await User.countDocuments({ status: 'rejected' });

    // Get course count
    const coursesAvailable = await Course.countDocuments({ isActive: true });

    // Get department count
    const totalDepartments = await Department.countDocuments({ isActive: true });

    // Calculate success rate based on approved users vs total registered users
    const totalRegisteredUsers = await User.countDocuments({});
    const approvedUsers = await User.countDocuments({ status: 'approved' });
    const successRate = totalRegisteredUsers > 0 ? Math.round((approvedUsers / totalRegisteredUsers) * 100) : 0;

    // Get department-wise statistics
    const departmentStats = await Department.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'department',
          as: 'users'
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'department',
          as: 'courses'
        }
      },
      {
        $project: {
          name: 1,
          code: 1,
          studentCount: {
            $size: {
              $filter: {
                input: '$users',
                cond: { 
                  $and: [
                    { $eq: ['$$this.role', 'student'] },
                    { $eq: ['$$this.isActive', true] },
                    { $eq: ['$$this.status', 'approved'] }
                  ]
                }
              }
            }
          },
          teacherCount: {
            $size: {
              $filter: {
                input: '$users',
                cond: { 
                  $and: [
                    { $eq: ['$$this.role', 'teacher'] },
                    { $eq: ['$$this.isActive', true] },
                    { $eq: ['$$this.status', 'approved'] }
                  ]
                }
              }
            }
          },
          courseCount: {
            $size: {
              $filter: {
                input: '$courses',
                cond: { $eq: ['$$this.isActive', true] }
              }
            }
          },
          successRate: {
            $cond: {
              if: { $gt: [{ $size: '$users' }, 0] },
              then: {
                $multiply: [
                  {
                    $divide: [
                      {
                        $size: {
                          $filter: {
                            input: '$users',
                            cond: { 
                              $and: [
                                { $eq: ['$$this.isActive', true] },
                                { $eq: ['$$this.status', 'approved'] }
                              ]
                            }
                          }
                        }
                      },
                      { $size: '$users' }
                    ]
                  },
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);

    const statistics = {
      overall: {
        activeStudents,
        expertTeachers,
        coursesAvailable,
        successRate,
        totalDepartments,
        totalUsers,
        admins,
        approvedUsers,
        pendingUsers,
        pendingStudents,
        pendingTeachers,
        rejectedUsers
      },
      departments: departmentStats
    };

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('❌ [STATISTICS] Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// @route   GET /api/statistics/departments
// @desc    Get department-wise detailed statistics
// @access  Public
router.get('/departments', async (req, res) => {
  try {
    const departmentStats = await Department.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'department',
          as: 'users'
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'department',
          as: 'courses'
        }
      },
      {
        $lookup: {
          from: 'batches',
          localField: '_id',
          foreignField: 'department',
          as: 'batches'
        }
      },
      {
        $project: {
          name: 1,
          code: 1,
          description: 1,
          totalUsers: { $size: '$users' },
          activeUsers: {
            $size: {
              $filter: {
                input: '$users',
                cond: { 
                  $and: [
                    { $eq: ['$$this.isActive', true] },
                    { $eq: ['$$this.status', 'approved'] }
                  ]
                }
              }
            }
          },
          studentCount: {
            $size: {
              $filter: {
                input: '$users',
                cond: { 
                  $and: [
                    { $eq: ['$$this.role', 'student'] },
                    { $eq: ['$$this.isActive', true] },
                    { $eq: ['$$this.status', 'approved'] }
                  ]
                }
              }
            }
          },
          teacherCount: {
            $size: {
              $filter: {
                input: '$users',
                cond: { 
                  $and: [
                    { $eq: ['$$this.role', 'teacher'] },
                    { $eq: ['$$this.isActive', true] },
                    { $eq: ['$$this.status', 'approved'] }
                  ]
                }
              }
            }
          },
          courseCount: {
            $size: {
              $filter: {
                input: '$courses',
                cond: { $eq: ['$$this.isActive', true] }
              }
            }
          },
          batchCount: {
            $size: {
              $filter: {
                input: '$batches',
                cond: { $eq: ['$$this.status', 'active'] }
              }
            }
          },
          successRate: {
            $cond: {
              if: { $gt: [{ $size: '$users' }, 0] },
              then: {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $size: {
                              $filter: {
                                input: '$users',
                                cond: { 
                                  $and: [
                                    { $eq: ['$$this.isActive', true] },
                                    { $eq: ['$$this.status', 'approved'] }
                                  ]
                                }
                              }
                            }
                          },
                          { $size: '$users' }
                        ]
                      },
                      100
                    ]
                  },
                  0
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);

    res.json({
      success: true,
      data: departmentStats
    });
  } catch (error) {
    console.error('❌ [STATISTICS] Error fetching department statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department statistics',
      error: error.message
    });
  }
});

module.exports = router;
