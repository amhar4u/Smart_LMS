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

// @route   GET /api/semesters/current
// @desc    Get current semester
// @access  Public
router.get('/current', async (req, res) => {
  try {
    console.log('📅 [SEMESTERS] Fetching current semester');

    const currentSemester = await Semester.getCurrentSemester();

    if (!currentSemester) {
      return res.status(404).json({
        success: false,
        message: 'No current semester found'
      });
    }

    console.log(`✅ [SEMESTERS] Found current semester: ${currentSemester.name}`);

    res.json({
      success: true,
      data: currentSemester
    });
  } catch (error) {
    console.error('❌ [SEMESTERS] Error fetching current semester:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching current semester',
      error: error.message
    });
  }
});

// @route   GET /api/semesters/year/:year
// @desc    Get semesters by year
// @access  Public
router.get('/year/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    console.log(`📅 [SEMESTERS] Fetching semesters for year: ${year}`);

    const semesters = await Semester.getSemestersByYear(year);

    console.log(`✅ [SEMESTERS] Found ${semesters.length} semesters for year ${year}`);

    res.json({
      success: true,
      data: semesters,
      count: semesters.length
    });
  } catch (error) {
    console.error('❌ [SEMESTERS] Error fetching semesters by year:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching semesters by year',
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
      year,
      type,
      batch,
      startDate,
      endDate,
      registrationStartDate,
      registrationEndDate,
      description,
      isActive,
      isCurrent
    } = req.body;

    // Check if semester with same code already exists
    const existingSemester = await Semester.findOne({
      code: code.toUpperCase()
    });

    if (existingSemester) {
      return res.status(400).json({
        success: false,
        message: 'Semester with this code already exists'
      });
    }

    // Check if semester with same year and type already exists
    const existingYearType = await Semester.findOne({
      year,
      type: type.toLowerCase()
    });

    if (existingYearType) {
      return res.status(400).json({
        success: false,
        message: `A ${type} semester for year ${year} already exists`
      });
    }

    const semesterData = {
      name: name.trim(),
      code: code.toUpperCase().trim(),
      year,
      type: type.toLowerCase(),
      batch,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      description: description?.trim(),
      isActive: isActive !== undefined ? isActive : true,
      isCurrent: isCurrent || false
    };

    // Add registration dates if provided
    if (registrationStartDate) {
      semesterData.registrationStartDate = new Date(registrationStartDate);
    }
    if (registrationEndDate) {
      semesterData.registrationEndDate = new Date(registrationEndDate);
    }

    const semester = new Semester(semesterData);
    await semester.save();

    console.log(`✅ [SEMESTERS] Created semester: ${semester.name} (${semester.code})`);

    res.status(201).json({
      success: true,
      data: semester,
      message: 'Semester created successfully'
    });
  } catch (error) {
    console.error('❌ [SEMESTERS] Error creating semester:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
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
      year,
      type,
      batch,
      startDate,
      endDate,
      registrationStartDate,
      registrationEndDate,
      description,
      isActive,
      isCurrent
    } = req.body;

    const semester = await Semester.findById(req.params.id);

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    // Check if new code conflicts with existing semesters
    if (code && code !== semester.code) {
      const existingSemester = await Semester.findOne({
        _id: { $ne: req.params.id },
        code: code.toUpperCase()
      });

      if (existingSemester) {
        return res.status(400).json({
          success: false,
          message: 'Semester with this code already exists'
        });
      }
    }

    // Check if new year and type combination conflicts
    if ((year && year !== semester.year) || (type && type !== semester.type)) {
      const checkYear = year || semester.year;
      const checkType = type || semester.type;
      
      const existingYearType = await Semester.findOne({
        _id: { $ne: req.params.id },
        year: checkYear,
        type: checkType.toLowerCase()
      });

      if (existingYearType) {
        return res.status(400).json({
          success: false,
          message: `A ${checkType} semester for year ${checkYear} already exists`
        });
      }
    }

    // Update fields
    if (name) semester.name = name.trim();
    if (code) semester.code = code.toUpperCase().trim();
    if (year) semester.year = year;
    if (type) semester.type = type.toLowerCase();
    if (batch) semester.batch = batch;
    if (startDate) semester.startDate = new Date(startDate);
    if (endDate) semester.endDate = new Date(endDate);
    if (registrationStartDate) semester.registrationStartDate = new Date(registrationStartDate);
    if (registrationEndDate) semester.registrationEndDate = new Date(registrationEndDate);
    if (description !== undefined) semester.description = description?.trim();
    if (isActive !== undefined) semester.isActive = isActive;
    if (isCurrent !== undefined) semester.isCurrent = isCurrent;

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
        message: 'Semester with this code already exists'
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

// @route   PUT /api/semesters/:id/current
// @desc    Set semester as current
// @access  Private (Admin only)
router.put('/:id/current', auth, requireAdmin, async (req, res) => {
  try {
    console.log(`📅 [SEMESTERS] Setting semester as current: ${req.params.id}`);

    const semester = await Semester.findById(req.params.id);

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    if (!semester.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot set inactive semester as current'
      });
    }

    // Set this semester as current (the pre-save middleware will handle unsetting others)
    semester.isCurrent = true;
    await semester.save();

    console.log(`✅ [SEMESTERS] Semester set as current: ${semester.name}`);

    res.json({
      success: true,
      message: 'Semester set as current successfully',
      data: semester
    });
  } catch (error) {
    console.error('❌ [SEMESTERS] Error setting current semester:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting current semester',
      error: error.message
    });
  }
});

// @route   GET /api/semesters/batch/:batchId
// @desc    Get semesters by batch
// @access  Private
router.get('/batch/:batchId', auth, async (req, res) => {
  try {
    const { batchId } = req.params;
    console.log(`📅 [SEMESTERS] Fetching semesters for batch: ${batchId}`);

    const semesters = await Semester.find({ 
      batch: batchId,
      isActive: true 
    })
    .populate('batch', 'name code')
    .sort({ year: 1, type: 1 });

    console.log(`✅ [SEMESTERS] Found ${semesters.length} semesters for batch ${batchId}`);

    res.json({
      success: true,
      data: semesters,
      count: semesters.length
    });
  } catch (error) {
    console.error('❌ [SEMESTERS] Error fetching semesters by batch:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching semesters by batch',
      error: error.message
    });
  }
});

module.exports = router;
