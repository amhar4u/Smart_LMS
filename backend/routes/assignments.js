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
const { updateStudentSubjectLevel } = require('../services/studentSubjectLevelService');

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
      startDate,
      endDate,
      passingMarks,
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

    console.log('=== ASSIGNMENT CREATION DEBUG ===');
    console.log('Generated Questions Count:', questions.length);
    console.log('Assignment Type:', assignmentType);
    console.log('Questions with Correct Answers:');
    questions.forEach((q, idx) => {
      console.log(`Q${idx + 1}:`, {
        type: q.type,
        hasCorrectAnswer: !!q.correctAnswer,
        correctAnswer: q.correctAnswer ? q.correctAnswer.substring(0, 50) + '...' : 'MISSING',
        hasOptions: q.options ? q.options.length : 0,
        marks: q.marks
      });
    });

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
      startDate: startDate ? new Date(startDate) : new Date(), // Default to now if not provided
      endDate: endDate ? new Date(endDate) : new Date(dueDate), // Default to dueDate if not provided
      passingMarks: passingMarks || Math.floor((maxMarks || calculatedMaxMarks) * 0.4), // Default to 40% if not provided
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

// GET /api/assignments/:id/submissions - Get all submissions for an assignment
const AssignmentSubmission = require('../models/AssignmentSubmission');
const User = require('../models/User');

router.get('/:id/submissions', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      evaluationStatus,
      level,
      minPercentage,
      maxPercentage,
      search
    } = req.query;

    // Check if assignment exists
    const assignment = await Assignment.findById(req.params.id)
      .populate('subject', 'name')
      .populate('batch', 'name');
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Build filter
    const filter = { assignmentId: req.params.id };
    if (evaluationStatus) filter.evaluationStatus = evaluationStatus;
    if (level) filter.level = level;
    if (minPercentage) filter.percentage = { $gte: parseFloat(minPercentage) };
    if (maxPercentage) {
      filter.percentage = { ...filter.percentage, $lte: parseFloat(maxPercentage) };
    }

    const skip = (page - 1) * limit;

    let submissions = await AssignmentSubmission.find(filter)
      .populate({
        path: 'studentId',
        select: 'firstName lastName email studentId course batch',
        populate: [
          {
            path: 'course',
            select: 'name code'
          },
          {
            path: 'batch',
            select: 'name batchNumber'
          }
        ]
      })
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Apply search filter if provided
    if (search) {
      submissions = submissions.filter(sub => 
        sub.studentId?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        sub.studentId?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        sub.studentId?.email?.toLowerCase().includes(search.toLowerCase()) ||
        sub.studentId?.studentId?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await AssignmentSubmission.countDocuments(filter);

    // Calculate statistics
    const stats = await AssignmentSubmission.aggregate([
      { $match: { assignmentId: assignment._id } },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          evaluated: {
            $sum: { $cond: [{ $eq: ['$evaluationStatus', 'completed'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$evaluationStatus', 'pending'] }, 1, 0] }
          },
          avgPercentage: { $avg: '$percentage' },
          beginners: {
            $sum: { $cond: [{ $eq: ['$level', 'beginner'] }, 1, 0] }
          },
          intermediates: {
            $sum: { $cond: [{ $eq: ['$level', 'intermediate'] }, 1, 0] }
          },
          advanced: {
            $sum: { $cond: [{ $eq: ['$level', 'advanced'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        assignment: {
          _id: assignment._id,
          title: assignment.title,
          subject: assignment.subject,
          batch: assignment.batch,
          maxMarks: assignment.maxMarks,
          dueDate: assignment.dueDate
        },
        submissions,
        statistics: stats[0] || {
          totalSubmissions: 0,
          evaluated: 0,
          pending: 0,
          avgPercentage: 0,
          beginners: 0,
          intermediates: 0,
          advanced: 0
        }
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching assignment submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignment submissions',
      error: error.message
    });
  }
});

// GET /api/assignments/:assignmentId/submissions/:submissionId - Get single submission details
router.get('/:assignmentId/submissions/:submissionId', auth, async (req, res) => {
  try {
    const submission = await AssignmentSubmission.findById(req.params.submissionId)
      .populate({
        path: 'studentId',
        select: 'firstName lastName email studentId course',
        populate: {
          path: 'course',
          select: 'name code'
        }
      })
      .populate({
        path: 'gradedBy',
        select: 'firstName lastName email'
      });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    const assignment = await Assignment.findById(req.params.assignmentId)
      .populate('subject', 'name')
      .populate('batch', 'name');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      data: {
        submission,
        assignment
      }
    });
  } catch (error) {
    console.error('Error fetching submission details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submission details',
      error: error.message
    });
  }
});

// POST /api/assignments/:assignmentId/submissions/:submissionId/evaluate - Evaluate single submission
router.post('/:assignmentId/submissions/:submissionId/evaluate', auth, async (req, res) => {
  try {
    const { submissionId, assignmentId } = req.params;

    // Find submission
    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('studentId', 'name email');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Find assignment with all details
    const assignment = await Assignment.findById(assignmentId)
      .populate('subject', 'name');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if submission has answers
    if (!submission.submittedAnswers || submission.submittedAnswers.length === 0) {
      console.error('Evaluation failed: No answers in submission');
      console.log('Submission details:', {
        id: submission._id,
        studentId: submission.studentId,
        assignmentId: submission.assignmentId,
        status: submission.status,
        submittedAt: submission.submittedAt,
        answersCount: submission.submittedAnswers ? submission.submittedAnswers.length : 0
      });
      
      return res.status(400).json({
        success: false,
        message: 'Cannot evaluate submission with no answers. This submission appears to be incomplete. The student needs to retake and submit the assignment with answers.'
      });
    }

    // Additional check: Ensure answers have content
    const hasValidAnswers = submission.submittedAnswers.some(a => 
      (a.answer && a.answer.trim() !== '') || 
      (a.selectedOption !== undefined && a.selectedOption !== null)
    );

    if (!hasValidAnswers) {
      return res.status(400).json({
        success: false,
        message: 'Cannot evaluate submission - all answers are empty. The student needs to retake and provide actual answers.'
      });
    }

    // Update status to evaluating
    submission.evaluationStatus = 'evaluating';
    await submission.save();

    try {
      // Evaluate using AI
      const evaluation = await aiService.evaluateAssignment(
        assignment,
        submission.submittedAnswers
      );

      // Update submission with evaluation results
      submission.marks = evaluation.marks;
      submission.percentage = evaluation.percentage;
      submission.level = evaluation.level;
      submission.feedback = evaluation.feedback;
      submission.evaluationResponse = JSON.stringify(evaluation);
      submission.evaluationStatus = 'completed';
      submission.gradedAt = new Date();
      submission.gradedBy = req.user._id || req.user.id;
      submission.isAutoEvaluated = true;

      // Update individual question evaluations
      if (evaluation.questionEvaluations && evaluation.questionEvaluations.length > 0) {
        submission.submittedAnswers = submission.submittedAnswers.map((answer, index) => {
          const questionEval = evaluation.questionEvaluations.find(
            qe => qe.questionIndex === index + 1
          );
          if (questionEval) {
            answer.marksAwarded = questionEval.marksAwarded;
            answer.isCorrect = questionEval.isCorrect;
          }
          return answer;
        });
      }

      await submission.save();

      // Update student subject level after successful evaluation
      try {
        await updateStudentSubjectLevel(
          submission.studentId,
          assignmentId,
          evaluation.marks,
          evaluation.percentage,
          evaluation.level
        );
        console.log('✅ Student subject level updated successfully');
      } catch (levelError) {
        console.error('⚠️ Failed to update student subject level:', levelError);
        // Don't fail the evaluation if level update fails
      }

      res.json({
        success: true,
        message: 'Submission evaluated successfully',
        data: submission
      });
    } catch (aiError) {
      console.error('AI evaluation failed:', aiError);
      
      // Update status to failed
      submission.evaluationStatus = 'failed';
      await submission.save();

      return res.status(500).json({
        success: false,
        message: 'Failed to evaluate submission using AI',
        error: aiError.message
      });
    }
  } catch (error) {
    console.error('Error evaluating submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error evaluating submission',
      error: error.message
    });
  }
});

// POST /api/assignments/:assignmentId/submissions/evaluate-all - Evaluate all pending submissions
router.post('/:assignmentId/submissions/evaluate-all', auth, async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // Find assignment
    const assignment = await Assignment.findById(assignmentId)
      .populate('subject', 'name');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Find all pending submissions
    const submissions = await AssignmentSubmission.find({
      assignmentId: assignmentId,
      evaluationStatus: 'pending'
    });

    if (submissions.length === 0) {
      return res.json({
        success: true,
        message: 'No pending submissions to evaluate',
        data: {
          total: 0,
          evaluated: 0,
          failed: 0
        }
      });
    }

    let evaluated = 0;
    let failed = 0;
    const results = [];

    // Evaluate each submission
    for (const submission of submissions) {
      try {
        submission.evaluationStatus = 'evaluating';
        await submission.save();

        const evaluation = await aiService.evaluateAssignment(
          assignment,
          submission.submittedAnswers
        );

        submission.marks = evaluation.marks;
        submission.percentage = evaluation.percentage;
        submission.level = evaluation.level;
        submission.feedback = evaluation.feedback;
        submission.evaluationResponse = JSON.stringify(evaluation);
        submission.evaluationStatus = 'completed';
        submission.gradedAt = new Date();
        submission.gradedBy = req.user._id || req.user.id;
        submission.isAutoEvaluated = true;

        if (evaluation.questionEvaluations && evaluation.questionEvaluations.length > 0) {
          submission.submittedAnswers = submission.submittedAnswers.map((answer, index) => {
            const questionEval = evaluation.questionEvaluations.find(
              qe => qe.questionIndex === index + 1
            );
            if (questionEval) {
              answer.marksAwarded = questionEval.marksAwarded;
              answer.isCorrect = questionEval.isCorrect;
            }
            return answer;
          });
        }

        await submission.save();

        // Update student subject level after successful evaluation
        try {
          await updateStudentSubjectLevel(
            submission.studentId,
            assignmentId,
            evaluation.marks,
            evaluation.percentage,
            evaluation.level
          );
        } catch (levelError) {
          console.error('⚠️ Failed to update student subject level:', levelError);
          // Don't fail the evaluation if level update fails
        }

        evaluated++;
        
        results.push({
          submissionId: submission._id,
          studentId: submission.studentId,
          status: 'success',
          marks: submission.marks,
          percentage: submission.percentage,
          level: submission.level
        });
      } catch (error) {
        console.error(`Failed to evaluate submission ${submission._id}:`, error);
        
        submission.evaluationStatus = 'failed';
        await submission.save();
        failed++;

        results.push({
          submissionId: submission._id,
          studentId: submission.studentId,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Evaluation completed. ${evaluated} successful, ${failed} failed.`,
      data: {
        total: submissions.length,
        evaluated,
        failed,
        results
      }
    });
  } catch (error) {
    console.error('Error evaluating all submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error evaluating submissions',
      error: error.message
    });
  }
});

// POST /api/assignments/:assignmentId/submissions/:submissionId/publish - Publish evaluation results
router.post('/:assignmentId/submissions/:submissionId/publish', auth, async (req, res) => {
  try {
    const submission = await AssignmentSubmission.findById(req.params.submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    if (submission.evaluationStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Submission must be evaluated before publishing'
      });
    }

    submission.status = 'graded';
    submission.isPublished = true;
    await submission.save();

    res.json({
      success: true,
      message: 'Evaluation results published successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error publishing evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Error publishing evaluation',
      error: error.message
    });
  }
});

// POST /api/assignments/:assignmentId/submissions/publish-all - Publish all evaluated submissions
router.post('/:assignmentId/submissions/publish-all', auth, async (req, res) => {
  try {
    const result = await AssignmentSubmission.updateMany(
      {
        assignmentId: req.params.assignmentId,
        evaluationStatus: 'completed',
        status: 'submitted'
      },
      {
        $set: { 
          status: 'graded',
          isPublished: true
        }
      }
    );

    res.json({
      success: true,
      message: `Published ${result.modifiedCount} evaluations`,
      data: {
        published: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error publishing all evaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Error publishing evaluations',
      error: error.message
    });
  }
});

// DELETE /api/assignments/:assignmentId/submissions/:submissionId - Delete a submission (Admin/Lecturer only)
router.delete('/:assignmentId/submissions/:submissionId', auth, async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    
    // Check if user is admin or lecturer
    if (req.user.role !== 'admin' && req.user.role !== 'lecturer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins and lecturers can delete submissions.'
      });
    }

    console.log('🗑️ Deleting submission:', submissionId, 'for assignment:', assignmentId);

    // Find the submission
    const submission = await AssignmentSubmission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Verify submission belongs to the assignment
    if (submission.assignmentId.toString() !== assignmentId) {
      return res.status(400).json({
        success: false,
        message: 'Submission does not belong to this assignment'
      });
    }

    // Store student info for response
    const studentId = submission.studentId;
    const studentInfo = await require('../models/User').findById(studentId, 'firstName lastName email');

    // Delete the submission
    await AssignmentSubmission.findByIdAndDelete(submissionId);

    console.log('✅ Submission deleted successfully');

    res.json({
      success: true,
      message: 'Submission deleted successfully. Student can now resubmit.',
      data: {
        deletedSubmissionId: submissionId,
        assignmentId: assignmentId,
        student: studentInfo ? {
          id: studentInfo._id,
          name: `${studentInfo.firstName} ${studentInfo.lastName}`,
          email: studentInfo.email
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Error deleting submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting submission',
      error: error.message
    });
  }
});

// DELETE /api/assignments/:assignmentId/submissions - Delete all submissions for an assignment (Admin only)
router.delete('/:assignmentId/submissions', auth, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can delete all submissions.'
      });
    }

    console.log('🗑️ Deleting all submissions for assignment:', assignmentId);

    // Count submissions before deletion
    const count = await AssignmentSubmission.countDocuments({ assignmentId: assignmentId });

    // Delete all submissions for this assignment
    const result = await AssignmentSubmission.deleteMany({ assignmentId: assignmentId });

    console.log(`✅ Deleted ${result.deletedCount} submissions`);

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} submission(s). Students can now resubmit.`,
      data: {
        assignmentId: assignmentId,
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    console.error('❌ Error deleting submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting submissions',
      error: error.message
    });
  }
});

module.exports = router;
