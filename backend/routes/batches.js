const express = require('express');
const { body, validationResult } = require('express-validator');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const Department = require('../models/Department');
const Semester = require('../models/Semester');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/batches
// @desc    Get all batches with pagination and filtering
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      course,
      department,
      status,
      startYear
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (course) filter.course = course;
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (startYear) filter.startYear = parseInt(startYear);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get batches with population
    const batches = await Batch.find(filter)
      .populate('course', 'name code')
      .populate('department', 'name code')
      .populate('currentSemester', 'name code year type')
      .populate('semesters', 'name code year type')
      .sort({ startYear: -1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Batch.countDocuments(filter);

    res.json({
      success: true,
      data: batches,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching batches',
      error: error.message
    });
  }
});

// @route   GET /api/batches/active
// @desc    Get all active batches
// @access  Private
router.get('/active', auth, async (req, res) => {
  try {
    const batches = await Batch.getActiveBatches();
    
    res.json({
      success: true,
      data: batches
    });
  } catch (error) {
    console.error('Error fetching active batches:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active batches',
      error: error.message
    });
  }
});

// @route   GET /api/batches/course/:courseId
// @desc    Get batches by course
// @access  Private
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const batches = await Batch.getBatchesByCourse(courseId);
    
    res.json({
      success: true,
      data: batches
    });
  } catch (error) {
    console.error('Error fetching batches by course:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching batches by course',
      error: error.message
    });
  }
});

// @route   GET /api/batches/department/:departmentId
// @desc    Get batches by department
// @access  Private
router.get('/department/:departmentId', auth, async (req, res) => {
  try {
    const { departmentId } = req.params;
    const batches = await Batch.getBatchesByDepartment(departmentId);
    
    res.json({
      success: true,
      data: batches
    });
  } catch (error) {
    console.error('Error fetching batches by department:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching batches by department',
      error: error.message
    });
  }
});

// @route   GET /api/batches/:id
// @desc    Get batch by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('course', 'name code')
      .populate('department', 'name code')
      .populate('currentSemester', 'name code year type startDate endDate')
      .populate('semesters', 'name code year type startDate endDate')
      .populate('createdBy', 'firstName lastName email');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    res.json({
      success: true,
      data: batch
    });
  } catch (error) {
    console.error('Error fetching batch:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching batch',
      error: error.message
    });
  }
});

// @route   POST /api/batches
// @desc    Create a new batch
// @access  Private (Admin only)
router.post('/', [
  auth,
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Batch name must be between 2-100 characters'),
  body('code')
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage('Batch code must be between 2-10 characters'),
  body('course')
    .notEmpty()
    .withMessage('Course is required'),
  body('department')
    .notEmpty()
    .withMessage('Department is required'),
  body('startYear')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Start year must be between 2020-2030'),
  body('endYear')
    .isInt({ min: 2020, max: 2035 })
    .withMessage('End year must be between 2020-2035'),
  body('maxStudents')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Max students must be between 1-500')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can create batches.'
      });
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name,
      code,
      course,
      department,
      startYear,
      endYear,
      maxStudents,
      description
    } = req.body;

    // Verify course and department exist
    const courseExists = await Course.findById(course);
    const departmentExists = await Department.findById(department);

    if (!courseExists) {
      return res.status(400).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!departmentExists) {
      return res.status(400).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if batch code already exists
    const existingBatch = await Batch.findOne({ code: code.toUpperCase() });
    if (existingBatch) {
      return res.status(400).json({
        success: false,
        message: 'Batch with this code already exists'
      });
    }

    // Create new batch
    const batch = new Batch({
      name,
      code: code.toUpperCase(),
      course,
      department,
      startYear: parseInt(startYear),
      endYear: parseInt(endYear),
      maxStudents: maxStudents || 60,
      description,
      createdBy: req.user._id
    });

    await batch.save();

    // Populate the created batch for response
    await batch.populate('course department createdBy');

    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: batch
    });
  } catch (error) {
    console.error('Error creating batch:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Batch with this code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating batch',
      error: error.message
    });
  }
});

// @route   PUT /api/batches/:id
// @desc    Update batch
// @access  Private (Admin only)
router.put('/:id', [
  auth,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Batch name must be between 2-100 characters'),
  body('maxStudents')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Max students must be between 1-500')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can update batches.'
      });
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'maxStudents', 'status'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Validate that maxStudents is not less than current enrollment
    if (updates.maxStudents && updates.maxStudents < batch.currentEnrollment) {
      return res.status(400).json({
        success: false,
        message: `Maximum students cannot be less than current enrollment (${batch.currentEnrollment})`
      });
    }

    const updatedBatch = await Batch.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('course department currentSemester');

    res.json({
      success: true,
      message: 'Batch updated successfully',
      data: updatedBatch
    });
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating batch',
      error: error.message
    });
  }
});

// @route   POST /api/batches/:id/semesters
// @desc    Add semester to batch
// @access  Private (Admin only)
router.post('/:id/semesters', [
  auth,
  body('semesterId')
    .notEmpty()
    .withMessage('Semester ID is required')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can manage batch semesters.'
      });
    }

    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    const { semesterId } = req.body;

    // Verify semester exists
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(400).json({
        success: false,
        message: 'Semester not found'
      });
    }

    await batch.addSemester(semesterId);
    await batch.populate('semesters');

    res.json({
      success: true,
      message: 'Semester added to batch successfully',
      data: batch
    });
  } catch (error) {
    console.error('Error adding semester to batch:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding semester to batch',
      error: error.message
    });
  }
});

// @route   PUT /api/batches/:id/current-semester
// @desc    Set current semester for batch
// @access  Private (Admin only)
router.put('/:id/current-semester', [
  auth,
  body('semesterId')
    .notEmpty()
    .withMessage('Semester ID is required')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can set current semester.'
      });
    }

    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    const { semesterId } = req.body;

    // Verify semester exists
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(400).json({
        success: false,
        message: 'Semester not found'
      });
    }

    await batch.setCurrentSemester(semesterId);
    await batch.populate('currentSemester semesters');

    // Update all students in this batch to the new current semester
    await User.updateMany(
      { batch: batch._id, role: 'student' },
      { semester: semesterId }
    );

    res.json({
      success: true,
      message: 'Current semester updated successfully for batch and all students',
      data: batch
    });
  } catch (error) {
    console.error('Error setting current semester:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting current semester',
      error: error.message
    });
  }
});

// @route   DELETE /api/batches/:id
// @desc    Delete batch (soft delete)
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can delete batches.'
      });
    }

    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Check if batch has students enrolled
    const studentsCount = await User.countDocuments({ 
      batch: batch._id, 
      role: 'student' 
    });

    if (studentsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete batch. ${studentsCount} students are currently enrolled.`
      });
    }

    // Soft delete by setting isActive to false
    batch.isActive = false;
    batch.status = 'inactive';
    await batch.save();

    res.json({
      success: true,
      message: 'Batch deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting batch',
      error: error.message
    });
  }
});

module.exports = router;
