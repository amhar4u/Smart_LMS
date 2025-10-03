const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Module = require('../models/Module');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const Semester = require('../models/Semester');
const Subject = require('../models/Subject');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const aiService = require('../services/aiService');

// Validation rules for assignment creation
const assignmentValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('department').isMongoId().withMessage('Valid department ID is required'),
  body('course').isMongoId().withMessage('Valid course ID is required'),
  body('batch').isMongoId().withMessage('Valid batch ID is required'),
  body('semester').isMongoId().withMessage('Valid semester ID is required'),
  body('subject').isMongoId().withMessage('Valid subject ID is required'),
  body('modules').isArray({ min: 1 }).withMessage('At least one module is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('assignmentLevel').isIn(['easy', 'medium', 'hard']).withMessage('Valid assignment level is required'),
  body('assignmentType').isIn(['MCQ', 'short_answer', 'essay']).withMessage('Valid assignment type is required'),
  body('numberOfQuestions').isInt({ min: 1, max: 100 }).withMessage('Number of questions must be between 1 and 100'),
  body('maxMarks').isInt({ min: 1 }).withMessage('Maximum marks must be at least 1')
];

// GET /api/assignments - Get all assignments with filters
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      department,
      course,
      batch,
      semester,
      subject,
      assignmentLevel,
      assignmentType,
      isActive
    } = req.query;

    // Build filter object
    const filter = {};
    if (department) filter.department = department;
    if (course) filter.course = course;
    if (batch) filter.batch = batch;
    if (semester) filter.semester = semester;
    if (subject) filter.subject = subject;
    if (assignmentLevel) filter.assignmentLevel = assignmentLevel;
    if (assignmentType) filter.assignmentType = assignmentType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // If user is a student, only show assignments for their batch
    if (req.user.role === 'student') {
      // Assuming user has batch information
      filter.batch = req.user.batch;
    }

    const skip = (page - 1) * limit;

    const assignments = await Assignment.find(filter)
      .populate('department', 'name')
      .populate('course', 'name')
      .populate('batch', 'name')
      .populate('semester', 'name')
      .populate('subject', 'name')
      .populate('modules', 'title')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Assignment.countDocuments(filter);

    res.json({
      success: true,
      data: assignments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignments',
      error: error.message
    });
  }
});

// GET /api/assignments/:id - Get single assignment
router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('department', 'name')
      .populate('course', 'name')
      .populate('batch', 'name')
      .populate('semester', 'name')
      .populate('subject', 'name')
      .populate('modules', 'title content')
      .populate('createdBy', 'name email');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignment',
      error: error.message
    });
  }
});

// POST /api/assignments - Create new assignment
router.post('/', auth, assignmentValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      department,
      course,
      batch,
      semester,
      subject,
      modules,
      dueDate,
      assignmentLevel,
      assignmentType,
      numberOfQuestions,
      maxMarks,
      instructions,
      submissionType,
      allowLateSubmission,
      lateSubmissionPenalty,
      timeLimit,
      contentSource, // 'module_name' or 'module_content'
      moduleContent // If providing content directly
    } = req.body;

    // Verify all referenced entities exist
    const [departmentDoc, courseDoc, batchDoc, semesterDoc, subjectDoc] = await Promise.all([
      Department.findById(department),
      Course.findById(course),
      Batch.findById(batch),
      Semester.findById(semester),
      Subject.findById(subject)
    ]);

    if (!departmentDoc || !courseDoc || !batchDoc || !semesterDoc || !subjectDoc) {
      return res.status(400).json({
        success: false,
        message: 'One or more referenced entities not found'
      });
    }

    // Verify modules exist
    const moduleDocuments = await Module.find({ _id: { $in: modules } });
    if (moduleDocuments.length !== modules.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more modules not found'
      });
    }

    // Generate questions using AI
    let questions = [];
    let generatedFromContent = '';

    try {
      if (contentSource === 'module_content' && moduleContent) {
        // Use provided content
        questions = await aiService.generateQuestions(
          moduleContent,
          assignmentType,
          numberOfQuestions,
          assignmentLevel,
          subjectDoc.name
        );
        generatedFromContent = moduleContent;
      } else {
        // Use module names and any available content
        const moduleNames = moduleDocuments.map(m => m.title).join(', ');
        const moduleContents = moduleDocuments
          .filter(m => m.content)
          .map(m => `${m.title}: ${m.content}`)
          .join('\n\n');

        if (moduleContents) {
          questions = await aiService.generateQuestions(
            moduleContents,
            assignmentType,
            numberOfQuestions,
            assignmentLevel,
            subjectDoc.name
          );
          generatedFromContent = moduleContents;
        } else {
          questions = await aiService.generateFromModuleName(
            moduleNames,
            assignmentType,
            numberOfQuestions,
            assignmentLevel,
            subjectDoc.name
          );
          generatedFromContent = `Module Names: ${moduleNames}`;
        }
      }
    } catch (aiError) {
      console.error('AI generation failed:', aiError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate questions using AI',
        error: aiError.message
      });
    }

    // Calculate total marks based on generated questions
    const calculatedMaxMarks = questions.reduce((total, q) => total + (q.marks || 1), 0);

    // Ensure we have a valid user ID
    const userId = req.user._id || req.user.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found in request'
      });
    }

    const assignment = new Assignment({
      title,
      description,
      department,
      course,
      batch,
      semester,
      subject,
      modules,
      dueDate: new Date(dueDate),
      assignmentLevel,
      assignmentType,
      numberOfQuestions,
      questions,
      maxMarks: maxMarks || calculatedMaxMarks,
      instructions,
      submissionType,
      allowLateSubmission,
      lateSubmissionPenalty,
      timeLimit,
      createdBy: userId,
      generatedFromContent
    });

    const savedAssignment = await assignment.save();

    // Populate the saved assignment
    const populatedAssignment = await Assignment.findById(savedAssignment._id)
      .populate('department', 'name')
      .populate('course', 'name')
      .populate('batch', 'name')
      .populate('semester', 'name')
      .populate('subject', 'name')
      .populate('modules', 'title')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: populatedAssignment
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating assignment',
      error: error.message
    });
  }
});

// PUT /api/assignments/:id - Update assignment
router.put('/:id', auth, assignmentValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if user can update this assignment
    if (req.user.role !== 'admin' && assignment.createdBy.toString() !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this assignment'
      });
    }

    const updateData = { ...req.body };
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('department', 'name')
      .populate('course', 'name')
      .populate('batch', 'name')
      .populate('semester', 'name')
      .populate('subject', 'name')
      .populate('modules', 'title')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      data: updatedAssignment
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating assignment',
      error: error.message
    });
  }
});

// DELETE /api/assignments/:id - Delete assignment
router.delete('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if user can delete this assignment
    if (req.user.role !== 'admin' && assignment.createdBy.toString() !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this assignment'
      });
    }

    await Assignment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting assignment',
      error: error.message
    });
  }
});

// POST /api/assignments/:id/toggle-status - Toggle assignment active status
router.post('/:id/toggle-status', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    assignment.isActive = !assignment.isActive;
    await assignment.save();

    res.json({
      success: true,
      message: `Assignment ${assignment.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: assignment.isActive }
    });
  } catch (error) {
    console.error('Error toggling assignment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling assignment status',
      error: error.message
    });
  }
});

// POST /api/assignments/preview-questions - Preview questions before creating assignment
router.post('/preview-questions', auth, async (req, res) => {
  try {
    const {
      modules,
      assignmentType,
      numberOfQuestions,
      assignmentLevel,
      subject,
      contentSource,
      moduleContent
    } = req.body;

    if (!assignmentType || !numberOfQuestions || !assignmentLevel) {
      return res.status(400).json({
        success: false,
        message: 'Assignment type, number of questions, and level are required'
      });
    }

    // Get subject name
    let subjectName = 'General';
    if (subject) {
      const subjectDoc = await Subject.findById(subject);
      if (subjectDoc) {
        subjectName = subjectDoc.name;
      }
    }

    let questions = [];

    try {
      if (contentSource === 'module_content' && moduleContent) {
        questions = await aiService.generateQuestions(
          moduleContent,
          assignmentType,
          numberOfQuestions,
          assignmentLevel,
          subjectName
        );
      } else if (modules && modules.length > 0) {
        const moduleDocuments = await Module.find({ _id: { $in: modules } });
        const moduleNames = moduleDocuments.map(m => m.title).join(', ');
        const moduleContents = moduleDocuments
          .filter(m => m.content)
          .map(m => `${m.title}: ${m.content}`)
          .join('\n\n');

        if (moduleContents) {
          questions = await aiService.generateQuestions(
            moduleContents,
            assignmentType,
            numberOfQuestions,
            assignmentLevel,
            subjectName
          );
        } else {
          questions = await aiService.generateFromModuleName(
            moduleNames,
            assignmentType,
            numberOfQuestions,
            assignmentLevel,
            subjectName
          );
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Either modules or module content is required'
        });
      }
    } catch (aiError) {
      console.error('AI generation failed:', aiError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate questions using AI',
        error: aiError.message
      });
    }

    res.json({
      success: true,
      data: {
        questions,
        totalMarks: questions.reduce((total, q) => total + (q.marks || 1), 0)
      }
    });
  } catch (error) {
    console.error('Error previewing questions:', error);
    res.status(500).json({
      success: false,
      message: 'Error previewing questions',
      error: error.message
    });
  }
});

module.exports = router;
