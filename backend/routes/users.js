const express = require('express');
const User = require('../models/User');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const auth = require('../middleware/auth');
const { sendVerificationEmail, sendRejectionEmail } = require('../services/emailService');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    // req.user is already the full user object from auth middleware
    const user = req.user;
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated through this route
    delete updates.password;
    delete updates.email;
    delete updates.role;
    delete updates.studentId;
    delete updates.teacherId;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/users/by-role/:role
// @desc    Get users by role (admin, student, teacher)
// @access  Private (Admin only)
router.get('/by-role/:role', auth, async (req, res) => {
  try {
    const { role } = req.params;
    
    // Validate role
    if (!['admin', 'student', 'teacher'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin, student, or teacher'
      });
    }

    // Fetch users by role
    const users = await User.find({ role })
      .select('-password')
      .populate('department', 'name code')
      .populate('course', 'name code')
      .populate('batch', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        users,
        count: users.length
      }
    });
  } catch (error) {
    console.error('❌ Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/users/all
// @desc    Get all users with role-based filtering
// @access  Private (Admin only)
router.get('/all', auth, async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    
    // Build query
    let query = {};
    if (role && ['admin', 'student', 'teacher'].includes(role)) {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count
    const total = await User.countDocuments(query);
    
    // Fetch users with pagination
    const users = await User.find(query)
      .select('-password')
      .populate('department', 'name code')
      .populate('course', 'name code')
      .populate('batch', 'name code')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.status(200).json({
      success: true,
      data: {
        users,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/users/:id/approve
// @desc    Approve a user (admin only)
// @access  Private (Admin)
router.put('/:id/approve', auth, async (req, res) => {
  try {
    // Check if user is admin - req.user is the full user object from auth middleware
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Send verification email (non-blocking)
    sendVerificationEmail(user).catch(error => {
      console.error('Failed to send verification email:', error);
    });

    res.status(200).json({
      success: true,
      message: 'User approved successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/users/:id/reject
// @desc    Reject a user (admin only)
// @access  Private (Admin)
router.put('/:id/reject', auth, async (req, res) => {
  try {
    // Check if user is admin - req.user is the full user object from auth middleware
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Send rejection email (non-blocking)
    const reason = req.body.reason || '';
    sendRejectionEmail(user, reason).catch(error => {
      console.error('Failed to send rejection email:', error);
    });

    res.status(200).json({
      success: true,
      message: 'User rejected successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/users/pending
// @desc    Get all pending users (admin only)
// @access  Private (Admin)
router.get('/pending', auth, async (req, res) => {
  try {
    // Check if user is admin - req.user is the full user object from auth middleware
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { page = 1, limit = 10, role } = req.query;
    
    // Build query for pending users
    let query = { status: 'pending' };
    if (role && ['student', 'teacher'].includes(role)) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .populate('department', 'name code')
      .populate('course', 'name code')
      .populate('batch', 'name code')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Pending users fetched successfully',
      data: {
        users,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/users
// @desc    Create a new user (Admin only)
// @access  Private (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    const { firstName, lastName, email, role, phone, password, ...roleSpecificData } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !role || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: firstName, lastName, email, role, password'
      });
    }

    // Validate role
    if (!['admin', 'student', 'teacher'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin, student, or teacher'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user data object
    const userData = {
      firstName,
      lastName,
      email,
      role,
      phone,
      password,
      isActive: true,
      status: 'Active',
      ...roleSpecificData
    };

    // Create the user
    const user = new User(userData);
    await user.save();

    // Populate the user before returning
    const populatedUser = await User.findById(user._id)
      .populate('department', 'name code')
      .populate('course', 'name code')
      .populate('batch', 'name code');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: populatedUser // Return the full populated user object
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user by ID (Admin only)
// @access  Private (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated through this route
    delete updates.password;
    delete updates._id;
    delete updates.__v;

    // Get the old user data to check for status changes
    const oldUser = await User.findById(id);
    
    if (!oldUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const oldStatus = oldUser.status;
    const newStatus = updates.status;

    // Find and update user
    const user = await User.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
    .populate('department', 'name code')
    .populate('course', 'name code')
    .populate('batch', 'name code');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Send email notification if status changed
    if (newStatus && oldStatus !== newStatus) {
      if (newStatus === 'approved') {
        // Send verification/approval email
        sendVerificationEmail(user).catch(error => {
          console.error('Failed to send verification email:', error);
        });
      } else if (newStatus === 'rejected') {
        // Send rejection email
        const reason = updates.rejectionReason || req.body.reason || '';
        sendRejectionEmail(user, reason).catch(error => {
          console.error('Failed to send rejection email:', error);
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: user // Return the full populated user object instead of calling getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user by ID (Admin only)
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete user
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {
        deletedUser: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/users/search
// @desc    Search users with pagination and filtering
// @access  Private (Admin only)
router.get('/search', auth, async (req, res) => {
  try {
    const { query, role, status, page = 1, limit = 10 } = req.query;

    // Build search query
    let searchQuery = {};

    if (role && ['admin', 'student', 'teacher'].includes(role)) {
      searchQuery.role = role;
    }

    if (status) {
      if (status === 'active') {
        searchQuery.isActive = true;
      } else if (status === 'inactive') {
        searchQuery.isActive = false;
      } else {
        searchQuery.status = status;
      }
    }

    if (query) {
      searchQuery.$or = [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { studentId: { $regex: query, $options: 'i' } },
        { teacherId: { $regex: query, $options: 'i' } },
        { employeeId: { $regex: query, $options: 'i' } }
      ];
    }

    // Get total count
    const total = await User.countDocuments(searchQuery);

    // Fetch users with pagination
    const users = await User.find(searchQuery)
      .select('-password')
      .populate('department', 'name code')
      .populate('course', 'name code')
      .populate('batch', 'name code')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.status(200).json({
      success: true,
      data: {
        users,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        count: users.length
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
