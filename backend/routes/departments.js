const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
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

// @route   GET /api/departments
// @desc    Get all departments (public route for forms)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const departments = await Department.getActiveDepartments()
      .populate('head', 'firstName lastName email')
      .select('-__v');

    res.json({
      success: true,
      data: departments,
      count: departments.length
    });
  } catch (error) {
    console.error('❌ [DEPARTMENTS] Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching departments',
      error: error.message
    });
  }
});

// @route   GET /api/departments/:id
// @desc    Get department by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('head', 'firstName lastName email')
      .populate('teacherCount')
      .populate('studentCount');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('❌ [DEPARTMENTS] Error fetching department:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department',
      error: error.message
    });
  }
});

// @route   POST /api/departments
// @desc    Create new department
// @access  Private (Admin only)
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      head,
      establishedYear,
      faculty,
      contactInfo
    } = req.body;

    // Check if department with same name or code already exists
    const existingDepartment = await Department.findOne({
      $or: [
        { name: new RegExp(`^${name}$`, 'i') },
        { code: code.toUpperCase() }
      ]
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name or code already exists'
      });
    }

    // If head is provided, validate that the user exists and is a teacher
    if (head) {
      const headUser = await User.findById(head);
      if (!headUser || headUser.role !== 'teacher') {
        return res.status(400).json({
          success: false,
          message: 'Department head must be a valid teacher'
        });
      }
    }

    const department = new Department({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      description: description?.trim(),
      head,
      establishedYear,
      faculty: faculty?.trim(),
      contactInfo
    });

    await department.save();

    // Populate the head information for response
    await department.populate('head', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });
  } catch (error) {
    console.error('❌ [DEPARTMENTS] Error creating department:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name or code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating department',
      error: error.message
    });
  }
});

// @route   PUT /api/departments/:id
// @desc    Update department
// @access  Private (Admin only)
router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      head,
      establishedYear,
      faculty,
      contactInfo,
      isActive
    } = req.body;

    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if new name or code conflicts with existing departments
    if (name || code) {
      const existingDepartment = await Department.findOne({
        _id: { $ne: req.params.id },
        $or: [
          ...(name ? [{ name: new RegExp(`^${name}$`, 'i') }] : []),
          ...(code ? [{ code: code.toUpperCase() }] : [])
        ]
      });

      if (existingDepartment) {
        return res.status(400).json({
          success: false,
          message: 'Department with this name or code already exists'
        });
      }
    }

    // If head is provided, validate that the user exists and is a teacher
    if (head !== undefined && head !== null) {
      const headUser = await User.findById(head);
      if (!headUser || headUser.role !== 'teacher') {
        return res.status(400).json({
          success: false,
          message: 'Department head must be a valid teacher'
        });
      }
    }

    // Update fields
    if (name) department.name = name.trim();
    if (code) department.code = code.toUpperCase().trim();
    if (description !== undefined) department.description = description?.trim();
    if (head !== undefined) department.head = head;
    if (establishedYear) department.establishedYear = establishedYear;
    if (faculty !== undefined) department.faculty = faculty?.trim();
    if (contactInfo) department.contactInfo = { ...department.contactInfo, ...contactInfo };
    if (isActive !== undefined) department.isActive = isActive;

    await department.save();

    // Populate the head information for response
    await department.populate('head', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });
  } catch (error) {
    console.error('❌ [DEPARTMENTS] Error updating department:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name or code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating department',
      error: error.message
    });
  }
});

// @route   DELETE /api/departments/:id
// @desc    Delete department (soft delete by setting isActive to false)
// @access  Private (Admin only)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if there are active users in this department
    const activeUsers = await User.countDocuments({
      department: req.params.id,
      isActive: true
    });

    if (activeUsers > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department. ${activeUsers} active users are assigned to this department.`
      });
    }

    // Soft delete
    department.isActive = false;
    await department.save();

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('❌ [DEPARTMENTS] Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting department',
      error: error.message
    });
  }
});

// @route   GET /api/departments/:id/teachers
// @desc    Get all teachers in a department
// @access  Private
router.get('/:id/teachers', auth, async (req, res) => {
  try {
    const teachers = await User.find({
      department: req.params.id,
      role: 'teacher',
      isActive: true
    }).select('-password').populate('department', 'name code');

    res.json({
      success: true,
      data: teachers,
      count: teachers.length
    });
  } catch (error) {
    console.error('❌ [DEPARTMENTS] Error fetching teachers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teachers',
      error: error.message
    });
  }
});

// @route   GET /api/departments/:id/students
// @desc    Get all students in a department
// @access  Private
router.get('/:id/students', auth, async (req, res) => {
  try {
    const students = await User.find({
      department: req.params.id,
      role: 'student',
      isActive: true
    }).select('-password')
      .populate('department', 'name code')
      .populate('course', 'name code')
      .populate('semester', 'name order');

    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    console.error('❌ [DEPARTMENTS] Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
});

module.exports = router;
