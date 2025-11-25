const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import models
const Department = require('../models/Department');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const Semester = require('../models/Semester');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Module = require('../models/Module');
const ExtraModule = require('../models/ExtraModule');
const Meeting = require('../models/Meeting');
const Attendance = require('../models/Attendance');
const StudentSubjectLevel = require('../models/StudentSubjectLevel');

// Helper function to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

// @route   GET /api/dependencies/department/:id
// @desc    Check dependencies for a department
// @access  Private (Admin only)
router.get('/department/:id', auth, requireAdmin, async (req, res) => {
  try {
    const departmentId = req.params.id;
    
    // Check for courses
    const courses = await Course.find({ department: departmentId }).select('name code');
    
    // Check for students
    const students = await User.find({ 
      role: 'student',
      'studentProfile.departmentId': departmentId 
    }).select('firstName lastName email');
    
    // Check for lecturers
    const lecturers = await User.find({ 
      role: 'lecturer',
      'lecturerProfile.departmentId': departmentId 
    }).select('firstName lastName email');

    // Check for subjects
    const subjects = await Subject.find({ departmentId }).select('name code');

    const dependencies = {
      canDelete: courses.length === 0 && students.length === 0 && lecturers.length === 0 && subjects.length === 0,
      dependencies: {
        courses: { count: courses.length, items: courses },
        students: { count: students.length, items: students },
        lecturers: { count: lecturers.length, items: lecturers },
        subjects: { count: subjects.length, items: subjects }
      }
    };

    res.json({
      success: true,
      data: dependencies
    });
  } catch (error) {
    console.error('❌ Error checking department dependencies:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking dependencies',
      error: error.message
    });
  }
});

// @route   GET /api/dependencies/course/:id
// @desc    Check dependencies for a course
// @access  Private (Admin only)
router.get('/course/:id', auth, requireAdmin, async (req, res) => {
  try {
    const courseId = req.params.id;
    
    // Check for batches
    const batches = await Batch.find({ course: courseId }).select('name code');
    
    // Check for subjects
    const subjects = await Subject.find({ courseId }).select('name code');

    const dependencies = {
      canDelete: batches.length === 0 && subjects.length === 0,
      dependencies: {
        batches: { count: batches.length, items: batches },
        subjects: { count: subjects.length, items: subjects }
      }
    };

    res.json({
      success: true,
      data: dependencies
    });
  } catch (error) {
    console.error('❌ Error checking course dependencies:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking dependencies',
      error: error.message
    });
  }
});

// @route   GET /api/dependencies/batch/:id
// @desc    Check dependencies for a batch
// @access  Private (Admin only)
router.get('/batch/:id', auth, requireAdmin, async (req, res) => {
  try {
    const batchId = req.params.id;
    
    // Check for semesters
    const semesters = await Semester.find({ batch: batchId }).select('name semesterNumber');
    
    // Check for students
    const students = await User.find({ 
      role: 'student',
      'studentProfile.batchId': batchId 
    }).select('firstName lastName email');

    // Check for subjects
    const subjects = await Subject.find({ batchId }).select('name code');

    const dependencies = {
      canDelete: semesters.length === 0 && students.length === 0 && subjects.length === 0,
      dependencies: {
        semesters: { count: semesters.length, items: semesters },
        students: { count: students.length, items: students },
        subjects: { count: subjects.length, items: subjects }
      }
    };

    res.json({
      success: true,
      data: dependencies
    });
  } catch (error) {
    console.error('❌ Error checking batch dependencies:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking dependencies',
      error: error.message
    });
  }
});

// @route   GET /api/dependencies/semester/:id
// @desc    Check dependencies for a semester
// @access  Private (Admin only)
router.get('/semester/:id', auth, requireAdmin, async (req, res) => {
  try {
    const semesterId = req.params.id;
    
    // Check for subjects
    const subjects = await Subject.find({ semesterId }).select('name code');

    const dependencies = {
      canDelete: subjects.length === 0,
      dependencies: {
        subjects: { count: subjects.length, items: subjects }
      }
    };

    res.json({
      success: true,
      data: dependencies
    });
  } catch (error) {
    console.error('❌ Error checking semester dependencies:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking dependencies',
      error: error.message
    });
  }
});

// @route   GET /api/dependencies/subject/:id
// @desc    Check dependencies for a subject
// @access  Private (Admin only)
router.get('/subject/:id', auth, requireAdmin, async (req, res) => {
  try {
    const subjectId = req.params.id;
    
    // Check for modules
    const modules = await Module.find({ subject: subjectId }).select('title');
    
    // Check for extra modules
    const extraModules = await ExtraModule.find({ subject: subjectId }).select('title');
    
    // Check for assignments
    const assignments = await Assignment.find({ subjectId }).select('title');
    
    // Check for meetings
    const meetings = await Meeting.find({ subject: subjectId }).select('title date');

    // Check for student levels
    const studentLevels = await StudentSubjectLevel.find({ subjectId }).select('studentId');

    const dependencies = {
      canDelete: modules.length === 0 && extraModules.length === 0 && 
                 assignments.length === 0 && meetings.length === 0 && studentLevels.length === 0,
      dependencies: {
        modules: { count: modules.length, items: modules },
        extraModules: { count: extraModules.length, items: extraModules },
        assignments: { count: assignments.length, items: assignments },
        meetings: { count: meetings.length, items: meetings },
        studentLevels: { count: studentLevels.length, items: [] } // Don't expose student IDs
      }
    };

    res.json({
      success: true,
      data: dependencies
    });
  } catch (error) {
    console.error('❌ Error checking subject dependencies:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking dependencies',
      error: error.message
    });
  }
});

// @route   GET /api/dependencies/student/:id
// @desc    Check dependencies for a student
// @access  Private (Admin only)
router.get('/student/:id', auth, requireAdmin, async (req, res) => {
  try {
    const studentId = req.params.id;
    
    // Check for submissions
    const submissions = await AssignmentSubmission.find({ studentId })
      .populate('assignmentId', 'title')
      .select('assignmentId submittedAt grade');
    
    // Check for attendance
    const attendance = await Attendance.find({ studentId }).select('meetingId date status');
    
    // Check for student levels
    const studentLevels = await StudentSubjectLevel.find({ studentId })
      .populate('subjectId', 'name code')
      .select('subjectId level');

    const dependencies = {
      canDelete: false, // Student data should always require DELETE confirmation
      requiresConfirmation: true,
      dependencies: {
        submissions: { count: submissions.length, items: submissions.slice(0, 10) }, // Limit items
        attendance: { count: attendance.length, items: [] },
        studentLevels: { count: studentLevels.length, items: studentLevels }
      }
    };

    res.json({
      success: true,
      data: dependencies
    });
  } catch (error) {
    console.error('❌ Error checking student dependencies:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking dependencies',
      error: error.message
    });
  }
});

// @route   GET /api/dependencies/lecturer/:id
// @desc    Check dependencies for a lecturer
// @access  Private (Admin only)
router.get('/lecturer/:id', auth, requireAdmin, async (req, res) => {
  try {
    const lecturerId = req.params.id;
    
    // Check for subjects
    const subjects = await Subject.find({ lecturerId }).select('name code');
    
    // Check for meetings
    const meetings = await Meeting.find({ lecturer: lecturerId }).select('title date');

    const dependencies = {
      canDelete: subjects.length === 0 && meetings.length === 0,
      dependencies: {
        subjects: { count: subjects.length, items: subjects },
        meetings: { count: meetings.length, items: meetings }
      }
    };

    res.json({
      success: true,
      data: dependencies
    });
  } catch (error) {
    console.error('❌ Error checking lecturer dependencies:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking dependencies',
      error: error.message
    });
  }
});

// @route   GET /api/dependencies/assignment/:id
// @desc    Check dependencies for an assignment
// @access  Private (Admin only)
router.get('/assignment/:id', auth, requireAdmin, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    // Check for submissions
    const submissions = await AssignmentSubmission.find({ assignmentId })
      .populate('studentId', 'firstName lastName')
      .select('studentId submittedAt grade status');

    const dependencies = {
      canDelete: false, // Always require confirmation for assignments
      requiresConfirmation: true,
      dependencies: {
        submissions: { count: submissions.length, items: submissions.slice(0, 10) }
      }
    };

    res.json({
      success: true,
      data: dependencies
    });
  } catch (error) {
    console.error('❌ Error checking assignment dependencies:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking dependencies',
      error: error.message
    });
  }
});

// @route   GET /api/dependencies/module/:id
// @desc    Check dependencies for a module
// @access  Private (Admin only)
router.get('/module/:id', auth, requireAdmin, async (req, res) => {
  try {
    const moduleId = req.params.id;
    
    // Check for meetings
    const meetings = await Meeting.find({ module: moduleId }).select('title date');
    
    // Check for assignments
    const assignments = await Assignment.find({ moduleId }).select('title dueDate');

    const dependencies = {
      canDelete: meetings.length === 0 && assignments.length === 0,
      dependencies: {
        meetings: { count: meetings.length, items: meetings },
        assignments: { count: assignments.length, items: assignments }
      }
    };

    res.json({
      success: true,
      data: dependencies
    });
  } catch (error) {
    console.error('❌ Error checking module dependencies:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking dependencies',
      error: error.message
    });
  }
});

// @route   GET /api/dependencies/meeting/:id
// @desc    Check dependencies for a meeting
// @access  Private (Admin only)
router.get('/meeting/:id', auth, requireAdmin, async (req, res) => {
  try {
    const meetingId = req.params.id;
    
    // Check for attendance records
    const attendance = await Attendance.find({ meetingId }).select('studentId status');

    const dependencies = {
      canDelete: false, // Always require confirmation for meetings with attendance
      requiresConfirmation: true,
      dependencies: {
        attendance: { count: attendance.length, items: [] }
      }
    };

    res.json({
      success: true,
      data: dependencies
    });
  } catch (error) {
    console.error('❌ Error checking meeting dependencies:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking dependencies',
      error: error.message
    });
  }
});

module.exports = router;
