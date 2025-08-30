const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const auth = require('../middleware/auth');

// Get all courses (public access for registration forms)
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .select('name code description category')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses'
    });
  }
});

// Get all courses with pagination (admin access)
router.get('/admin', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';

    // Build query
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category && category !== 'all') {
      query.category = category;
    }

    const courses = await Course.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    console.error('Error fetching courses for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses'
    });
  }
});

// Get single course by ID
router.get('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const course = await Course.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course'
    });
  }
});

// Create new course
router.post('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const { name, code, description, category } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Course name and code are required'
      });
    }

    // Check if course with same name or code already exists
    const existingCourse = await Course.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        { code: { $regex: new RegExp(`^${code}$`, 'i') } }
      ]
    });

    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'Course with this name or code already exists'
      });
    }

    const course = new Course({
      name,
      code: code.toUpperCase(),
      description,
      category,
      createdBy: req.user.id
    });

    await course.save();

    // Populate the created course
    await course.populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    console.error('Error creating course:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Course with this ${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating course'
    });
  }
});

// Update course
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const { name, code, description, category, isActive } = req.body;

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course with same name or code already exists (excluding current course)
    if (name || code) {
      const query = { _id: { $ne: req.params.id } };
      const orConditions = [];
      
      if (name && name !== course.name) {
        orConditions.push({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      }
      if (code && code.toUpperCase() !== course.code) {
        orConditions.push({ code: { $regex: new RegExp(`^${code}$`, 'i') } });
      }
      
      if (orConditions.length > 0) {
        query.$or = orConditions;
        const existingCourse = await Course.findOne(query);
        
        if (existingCourse) {
          return res.status(400).json({
            success: false,
            message: 'Course with this name or code already exists'
          });
        }
      }
    }

    // Update fields
    if (name !== undefined) course.name = name;
    if (code !== undefined) course.code = code.toUpperCase();
    if (description !== undefined) course.description = description;
    if (category !== undefined) course.category = category;
    if (isActive !== undefined) course.isActive = isActive;

    await course.save();

    // Populate the updated course
    await course.populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    console.error('Error updating course:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Course with this ${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating course'
    });
  }
});

// Delete course
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting course'
    });
  }
});

// Toggle course active status
router.patch('/:id/toggle-status', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    await course.toggleActive();

    res.json({
      success: true,
      message: `Course ${course.isActive ? 'activated' : 'deactivated'} successfully`,
      data: course
    });
  } catch (error) {
    console.error('Error toggling course status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating course status'
    });
  }
});

module.exports = router;
