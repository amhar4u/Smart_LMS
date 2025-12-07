const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const auth = require('../middleware/auth');

// @route   POST /api/feedback
// @desc    Submit feedback (Students and Teachers only)
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    // Validate input
    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Rating and comment are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    if (comment.length < 10 || comment.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be between 10 and 500 characters'
      });
    }

    // Only students and teachers can submit feedback
    if (req.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admins cannot submit feedback'
      });
    }

    // Check if user already submitted feedback
    const existingFeedback = await Feedback.findOne({ user: req.user.id });
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback'
      });
    }

    const feedback = new Feedback({
      user: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      userRole: req.user.role,
      rating,
      comment
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully. It will be reviewed by admin.',
      data: { feedback }
    });
  } catch (error) {
    console.error('❌ Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/feedback
// @desc    Get all feedback (Admin sees all, authenticated required)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    
    let query = {};
    
    // Only admins can see all feedback
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    
    const feedbacks = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('user', 'firstName lastName profilePicture')
      .populate('reviewedBy', 'firstName lastName');

    const total = await Feedback.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        feedbacks,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/feedback/approved
// @desc    Get approved feedback for home page (limit 6)
// @access  Public
router.get('/approved', async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate({
        path: 'user',
        select: 'firstName lastName profilePicture department course',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'course', select: 'name' }
        ]
      });

    // Debug log to see populated data
    console.log('📝 Approved Feedbacks:', feedbacks.length);
    if (feedbacks.length > 0) {
      console.log('Sample feedback user data:', JSON.stringify({
        userName: feedbacks[0].userName,
        userRole: feedbacks[0].userRole,
        user: feedbacks[0].user
      }, null, 2));
    }

    res.status(200).json({
      success: true,
      data: { feedbacks }
    });
  } catch (error) {
    console.error('❌ Get approved feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch approved feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/feedback/my-feedback
// @desc    Get current user's feedback
// @access  Private
router.get('/my-feedback', auth, async (req, res) => {
  try {
    const feedback = await Feedback.findOne({ user: req.user.id });

    res.status(200).json({
      success: true,
      data: { feedback }
    });
  } catch (error) {
    console.error('❌ Get my feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/feedback/:id/approve
// @desc    Approve feedback (Admin only)
// @access  Private (Admin)
router.put('/:id/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('user', 'firstName lastName profilePicture');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Feedback approved successfully',
      data: { feedback }
    });
  } catch (error) {
    console.error('❌ Approve feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/feedback/:id/reject
// @desc    Reject feedback (Admin only)
// @access  Private (Admin)
router.put('/:id/reject', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('user', 'firstName lastName profilePicture');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Feedback rejected successfully',
      data: { feedback }
    });
  } catch (error) {
    console.error('❌ Reject feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/feedback/:id
// @desc    Delete feedback (Admin only)
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const feedback = await Feedback.findByIdAndDelete(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
