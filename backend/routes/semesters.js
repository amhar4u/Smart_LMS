const express = require('express');
const router = express.Router();
const Semester = require('../models/Semester');
const User = require('../models/User');
const auth = require('../middleware/auth');

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

// @route   GET /api/semesters
// @desc    Get all semesters (public route for forms)
// @access  Public
router.get('/', async (req, res) => {
  try {
    console.log('📅 [SEMESTERS] Fetching all active semesters');

    const semesters = await Semester.getActiveSemesters().select('-__v');

    console.log(`✅ [SEMESTERS] Found ${semesters.length} active semesters`);

    res.json({
      success: true,
      data: semesters,
      count: semesters.length
    });
  } catch (error) {
    console.error('❌ [SEMESTERS] Error fetching semesters:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching semesters',
      error: error.message
    });
  }
});

// @route   GET /api/semesters/:id
// @desc    Get semester by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    console.log(`📅 [SEMESTERS] Fetching semester with ID: ${req.params.id}`);

    const semester = await Semester.findById(req.params.id)
      .populate('studentCount');

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    console.log(`✅ [SEMESTERS] Found semester: ${semester.name}`);

    res.json({
      success: true,
      data: semester
    });
  } catch (error) {
    console.error('❌ [SEMESTERS] Error fetching semester:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching semester',
      error: error.message
    });
  }
});

// @route   POST /api/semesters
// @desc    Create new semester
// @access  Private (Admin only)
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    console.log('📅 [SEMESTERS] Creating new semester:', req.body);

    const {
      name,
      code,
      order,
      description,
      duration,
      creditRange
    } = req.body;

    // Check if semester with same name, code, or order already exists
    const existingSemester = await Semester.findOne({
      $or: [
        { name: new RegExp(`^${name}$`, 'i') },
        { code: code.toUpperCase() },
        { order: order }
      ]
    });

    if (existingSemester) {
      let conflictField = 'name';
      if (existingSemester.code === code.toUpperCase()) conflictField = 'code';
      if (existingSemester.order === order) conflictField = 'order';
      
      return res.status(400).json({
        success: false,
        message: `Semester with this ${conflictField} already exists`
      });
    }

    const semester = new Semester({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      order,
      description: description?.trim(),
      duration,
      creditRange: creditRange || { min: 12, max: 24 }
    });

    await semester.save();

    console.log(`✅ [SEMESTERS] Semester created successfully: ${semester.name}`);

    res.status(201).json({
      success: true,
      message: 'Semester created successfully',
      data: semester
    });
  } catch (error) {
    console.error('❌ [SEMESTERS] Error creating semester:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Semester with this name, code, or order already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating semester',
      error: error.message
    });
  }
});

// @route   PUT /api/semesters/:id
// @desc    Update semester
// @access  Private (Admin only)
router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    console.log(`📅 [SEMESTERS] Updating semester with ID: ${req.params.id}`);

    const {
      name,
      code,
      order,
      description,
      duration,
      creditRange,
      isActive
    } = req.body;

    const semester = await Semester.findById(req.params.id);

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    // Check if new name, code, or order conflicts with existing semesters
    if (name || code || order !== undefined) {
      const existingSemester = await Semester.findOne({
        _id: { $ne: req.params.id },
        $or: [
          ...(name ? [{ name: new RegExp(`^${name}$`, 'i') }] : []),
          ...(code ? [{ code: code.toUpperCase() }] : []),
          ...(order !== undefined ? [{ order: order }] : [])
        ]
      });

      if (existingSemester) {
        let conflictField = 'name';
        if (code && existingSemester.code === code.toUpperCase()) conflictField = 'code';
        if (order !== undefined && existingSemester.order === order) conflictField = 'order';
        
        return res.status(400).json({
          success: false,
          message: `Semester with this ${conflictField} already exists`
        });
      }
    }

    // Update fields
    if (name) semester.name = name.trim();
    if (code) semester.code = code.toUpperCase().trim();
    if (order !== undefined) semester.order = order;
    if (description !== undefined) semester.description = description?.trim();
    if (duration) semester.duration = duration;
    if (creditRange) semester.creditRange = { ...semester.creditRange, ...creditRange };
    if (isActive !== undefined) semester.isActive = isActive;

    await semester.save();

    console.log(`✅ [SEMESTERS] Semester updated successfully: ${semester.name}`);

    res.json({
      success: true,
      message: 'Semester updated successfully',
      data: semester
    });
  } catch (error) {
    console.error('❌ [SEMESTERS] Error updating semester:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Semester with this name, code, or order already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating semester',
      error: error.message
    });
  }
});

// @route   DELETE /api/semesters/:id
// @desc    Delete semester (soft delete by setting isActive to false)
// @access  Private (Admin only)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    console.log(`📅 [SEMESTERS] Deleting semester with ID: ${req.params.id}`);

    const semester = await Semester.findById(req.params.id);

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    // Check if there are active students in this semester
    const activeStudents = await User.countDocuments({
      semester: req.params.id,
      role: 'student',
      isActive: true
    });

    if (activeStudents > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete semester. ${activeStudents} active students are enrolled in this semester.`
      });
    }

    // Soft delete
    semester.isActive = false;
    await semester.save();

    console.log(`✅ [SEMESTERS] Semester deleted successfully: ${semester.name}`);

    res.json({
      success: true,
      message: 'Semester deleted successfully'
    });
  } catch (error) {
    console.error('❌ [SEMESTERS] Error deleting semester:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting semester',
      error: error.message
    });
  }
});

// @route   GET /api/semesters/:id/students
// @desc    Get all students in a semester
// @access  Private
router.get('/:id/students', auth, async (req, res) => {
  try {
    console.log(`📅 [SEMESTERS] Fetching students for semester: ${req.params.id}`);

    const students = await User.find({
      semester: req.params.id,
      role: 'student',
      isActive: true
    }).select('-password')
      .populate('department', 'name code')
      .populate('course', 'name code')
      .populate('semester', 'name order');

    console.log(`✅ [SEMESTERS] Found ${students.length} students`);

    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    console.error('❌ [SEMESTERS] Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
});

// @route   GET /api/semesters/order/:order
// @desc    Get semester by order number
// @access  Public
router.get('/order/:order', async (req, res) => {
  try {
    console.log(`📅 [SEMESTERS] Fetching semester with order: ${req.params.order}`);

    const semester = await Semester.getSemesterByOrder(parseInt(req.params.order));

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    console.log(`✅ [SEMESTERS] Found semester: ${semester.name}`);

    res.json({
      success: true,
      data: semester
    });
  } catch (error) {
    console.error('❌ [SEMESTERS] Error fetching semester:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching semester',
      error: error.message
    });
  }
});

module.exports = router;
