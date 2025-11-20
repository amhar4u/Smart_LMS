const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Semester = require('../models/Semester');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendSubjectAssignmentEmailToLecturer, sendSubjectEnrollmentEmailToStudent } = require('../services/emailService');
const NotificationService = require('../services/notificationService');

// Get all subjects with populated data
router.get('/', auth, async (req, res) => {
  try {
    const { department, course, semester, lecturer } = req.query;
    
    let filter = { isActive: true };
    
    if (department) filter.departmentId = department;
    if (course) filter.courseId = course;
    if (semester) filter.semesterId = semester;
    if (lecturer) filter.lecturerId = lecturer;

    const subjects = await Subject.find(filter)
      .populate('departmentId', 'name code')
      .populate('courseId', 'name code')
      .populate('batchId', 'name code startYear endYear')
      .populate('semesterId', 'name code year type')
      .populate('lecturerId', 'firstName lastName email')
      .sort({ name: 1 });

    res.json({ success: true, data: subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch subjects',
      error: error.message 
    });
  }
});

// Get subject by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('departmentId', 'name code')
      .populate('courseId', 'name code')
      .populate('semesterId', 'name code year type')
      .populate('lecturerId', 'firstName lastName email');

    if (!subject) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subject not found' 
      });
    }

    res.json({ success: true, data: subject });
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch subject',
      error: error.message 
    });
  }
});

// Create new subject
router.post('/', auth, async (req, res) => {
  try {
    const { name, code, departmentId, courseId, batchId, semesterId, creditHours, lecturerId, description } = req.body;

    // Validate required fields
    if (!name || !code || !departmentId || !courseId || !batchId || !semesterId || !creditHours || !lecturerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'All required fields must be provided' 
      });
    }

    // Check if department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid department selected' 
      });
    }

    // Check if course exists and belongs to the department
    const course = await Course.findById(courseId);
    if (!course || course.department.toString() !== departmentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid course selected for this department' 
      });
    }

    // Check if batch exists and belongs to the course
    const Batch = require('../models/Batch');
    const batch = await Batch.findById(batchId);
    if (!batch || batch.course.toString() !== courseId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid batch selected for this course' 
      });
    }

    // Check if semester exists and belongs to the batch
    const semester = await Semester.findById(semesterId);
    if (!semester || semester.batch.toString() !== batchId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid semester selected for this batch' 
      });
    }

    // Check if lecturer exists and has teacher role
    const lecturer = await User.findById(lecturerId);
    
    if (!lecturer || lecturer.role !== 'teacher' || lecturer.status !== 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid lecturer selected' 
      });
    }

    // Check if subject code already exists
    const existingSubject = await Subject.findOne({ code: code.toUpperCase() });
    if (existingSubject) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject code already exists' 
      });
    }

    const subject = new Subject({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      departmentId,
      courseId,
      batchId,
      semesterId,
      creditHours,
      lecturerId,
      description: description?.trim()
    });

    await subject.save();
    
    // Populate the created subject
    await subject.populate([
      { path: 'departmentId', select: 'name code' },
      { path: 'courseId', select: 'name code' },
      { path: 'batchId', select: 'name code startYear endYear' },
      { path: 'semesterId', select: 'name code year type' },
      { path: 'lecturerId', select: 'firstName lastName email' }
    ]);

    // Send email to lecturer (async, don't wait for it)
    sendSubjectAssignmentEmailToLecturer(lecturer, subject)
      .catch(err => console.error('Failed to send lecturer email:', err));

    // Find and send emails to all enrolled students in the same batch and semester
    const enrolledStudents = await User.find({
      role: 'student',
      status: 'approved',
      isActive: true,
      batch: batchId,
      semester: semesterId
    }).select('firstName lastName email');

    console.log(`📧 [SUBJECT] Sending enrollment emails to ${enrolledStudents.length} students...`);

    // Send emails to all enrolled students (async, don't wait)
    enrolledStudents.forEach(student => {
      sendSubjectEnrollmentEmailToStudent(student, subject)
        .catch(err => console.error(`Failed to send email to student ${student.email}:`, err));
    });

    // Send real-time notifications
    try {
      const io = req.app.get('io');
      const notificationService = new NotificationService(io);
      
      await notificationService.notifySubjectAssignment(
        req.user._id,
        lecturer._id,
        enrolledStudents.map(s => s._id),
        subject._id,
        subject.name,
        subject.code
      );
      
      console.log(`🔔 [SUBJECT] Notifications sent to lecturer and ${enrolledStudents.length} students`);
    } catch (notifError) {
      console.error('❌ Failed to send subject notifications:', notifError);
    }

    res.status(201).json({ 
      success: true, 
      message: 'Subject created successfully',
      data: subject,
      emailsSent: {
        lecturer: true,
        students: enrolledStudents.length
      }
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error',
        error: error.message 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create subject',
      error: error.message 
    });
  }
});

// Update subject
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, code, departmentId, courseId, semesterId, creditHours, lecturerId, description } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subject not found' 
      });
    }

    // Validate required fields
    if (!name || !code || !departmentId || !courseId || !semesterId || !creditHours || !lecturerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'All required fields must be provided' 
      });
    }

    // Check if department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid department selected' 
      });
    }

    // Check if course exists and belongs to the department
    const course = await Course.findById(courseId);
    if (!course || course.department.toString() !== departmentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid course selected for this department' 
      });
    }

    // Check if semester exists
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid semester selected' 
      });
    }

    // Check if lecturer exists and has teacher role
    const lecturer = await User.findById(lecturerId);
    if (!lecturer || lecturer.role !== 'teacher' || lecturer.status !== 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid lecturer selected' 
      });
    }

    // Check if subject code already exists (excluding current subject)
    const existingSubject = await Subject.findOne({ 
      code: code.toUpperCase(),
      _id: { $ne: req.params.id }
    });
    if (existingSubject) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject code already exists' 
      });
    }

    // Check if lecturer has changed
    const lecturerChanged = subject.lecturerId.toString() !== lecturerId;
    const oldLecturerId = subject.lecturerId;

    // Update subject
    subject.name = name.trim();
    subject.code = code.toUpperCase().trim();
    subject.departmentId = departmentId;
    subject.courseId = courseId;
    subject.semesterId = semesterId;
    subject.creditHours = creditHours;
    subject.lecturerId = lecturerId;
    subject.description = description?.trim();

    await subject.save();
    
    // Populate the updated subject
    await subject.populate([
      { path: 'departmentId', select: 'name code' },
      { path: 'courseId', select: 'name code' },
      { path: 'batchId', select: 'name code startYear endYear' },
      { path: 'semesterId', select: 'name code year type' },
      { path: 'lecturerId', select: 'firstName lastName email' }
    ]);

    // If lecturer changed, send email to new lecturer
    if (lecturerChanged) {
      console.log(`📧 [SUBJECT] Lecturer changed for subject ${subject.name}, sending email to new lecturer...`);
      sendSubjectAssignmentEmailToLecturer(lecturer, subject)
        .catch(err => console.error('Failed to send lecturer email:', err));
      
      // Send real-time notifications
      try {
        const io = req.app.get('io');
        const notificationService = new NotificationService(io);
        
        // Get enrolled students
        const enrolledStudents = await User.find({
          role: 'student',
          status: 'approved',
          isActive: true,
          batch: subject.batchId,
          semester: subject.semesterId
        }).select('_id');
        
        await notificationService.notifySubjectAssignment(
          req.user._id,
          lecturer._id,
          enrolledStudents.map(s => s._id),
          subject._id,
          subject.name,
          subject.code
        );
        
        console.log(`🔔 [SUBJECT] Lecturer reassignment notifications sent to new lecturer and ${enrolledStudents.length} students`);
      } catch (notifError) {
        console.error('❌ Failed to send subject reassignment notifications:', notifError);
      }
    }

    res.json({ 
      success: true, 
      message: 'Subject updated successfully',
      data: subject,
      lecturerEmailSent: lecturerChanged
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error',
        error: error.message 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update subject',
      error: error.message 
    });
  }
});

// Delete subject (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subject not found' 
      });
    }

    subject.isActive = false;
    await subject.save();

    res.json({ 
      success: true, 
      message: 'Subject deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete subject',
      error: error.message 
    });
  }
});

// Get courses by department
router.get('/courses/:departmentId', auth, async (req, res) => {
  try {
    const courses = await Course.find({ 
      department: req.params.departmentId, 
      isActive: true 
    }).select('name code').sort({ name: 1 });

    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Error fetching courses by department:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch courses',
      error: error.message 
    });
  }
});

// Get batches by course
router.get('/batches/:courseId', auth, async (req, res) => {
  try {
    const Batch = require('../models/Batch');
    const batches = await Batch.find({ 
      course: req.params.courseId, 
      isActive: true 
    }).select('name code startYear endYear').sort({ startYear: -1 });

    res.json({ success: true, data: batches });
  } catch (error) {
    console.error('Error fetching batches by course:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch batches',
      error: error.message 
    });
  }
});

// Get semesters by batch
router.get('/semesters/:batchId', auth, async (req, res) => {
  try {
    const semesters = await Semester.find({ 
      batch: req.params.batchId, 
      isActive: true 
    }).select('name code year type').sort({ year: -1, type: 1 });

    res.json({ success: true, data: semesters });
  } catch (error) {
    console.error('Error fetching semesters by batch:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch semesters',
      error: error.message 
    });
  }
});

// Get lecturers
router.get('/lecturers/all', auth, async (req, res) => {
  try {
    const lecturers = await User.find({ 
      role: 'teacher',
      status: 'approved',
      isActive: true 
    }).select('firstName lastName email').sort({ firstName: 1 });

    res.json({ success: true, data: lecturers });
  } catch (error) {
    console.error('Error fetching lecturers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch lecturers',
      error: error.message 
    });
  }
});

module.exports = router;
