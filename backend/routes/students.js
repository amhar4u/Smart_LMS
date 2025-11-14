const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const StudentSubjectLevel = require('../models/StudentSubjectLevel');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Module = require('../models/Module');
const Meeting = require('../models/Meeting');
const { evaluateAssignment } = require('../services/aiService');

// Middleware to ensure user is a student
const isStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Students only.' 
    });
  }
  next();
};

// ====== IMPORTANT: Specific routes MUST come before parameterized routes ======
// All /assignments/* routes must be defined before /:studentId/subjects

// Get active assignments for the logged-in student
router.get('/assignments/active', auth, isStudent, async (req, res) => {
  try {
    const studentId = req.user.userId;
    
    console.log('📝 [ASSIGNMENTS] Fetching active assignments for student:', studentId);
    
    // Get student's enrolled subjects with batch
    const student = await User.findById(studentId)
      .populate('batch')
      .populate('semester')
      .lean();
      
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    console.log('📝 [ASSIGNMENTS] Student batch:', student.batch?._id || student.batch);

    // Check if student has batch assigned
    if (!student.batch) {
      console.log('⚠️ [ASSIGNMENTS] Student missing batch');
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: 'No batch assigned'
      });
    }

    const batchId = student.batch._id || student.batch;
    const currentDate = new Date();
    
    // Find all assignments for the student's batch (same query as subject details page)
    const assignments = await Assignment.find({
      batch: batchId,
      isActive: true
    })
    .populate('subject', 'name code')
    .populate('course', 'name')
    .populate('batch', 'name')
    .populate('semester', 'name')
    .populate('modules', 'name title')
    .sort({ dueDate: 1 })
    .lean();

    console.log('📝 [ASSIGNMENTS] Found assignments:', assignments.length);

    // Check submission status for each assignment
    const assignmentsWithStatus = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = await AssignmentSubmission.findOne({
          assignmentId: assignment._id,
          studentId: studentId
        }).lean();

        const startDate = new Date(assignment.startDate || assignment.createdAt);
        const dueDate = new Date(assignment.dueDate);
        const canStart = !submission && currentDate >= startDate && currentDate <= dueDate;

        return {
          _id: assignment._id,
          title: assignment.title,
          description: assignment.description,
          subject: assignment.subject,
          course: assignment.course,
          batch: assignment.batch,
          semester: assignment.semester,
          modules: assignment.modules,
          startDate: startDate,
          dueDate: assignment.dueDate,
          endDate: assignment.endDate,
          totalMarks: assignment.totalMarks || assignment.maxMarks || 0,
          maxMarks: assignment.maxMarks || assignment.totalMarks || 0,
          passingMarks: assignment.passingMarks || 0,
          numberOfQuestions: assignment.numberOfQuestions || assignment.questionCount || (assignment.questions ? assignment.questions.length : 0),
          timeLimit: assignment.timeLimit || 60, // Default to 60 minutes if not set
          assignmentType: assignment.assignmentType,
          assignmentLevel: assignment.assignmentLevel,
          instructions: assignment.instructions,
          hasSubmitted: !!submission,
          submissionStatus: submission ? {
            submittedAt: submission.submittedAt,
            marks: submission.marks,
            percentage: submission.percentage,
            level: submission.level,
            evaluationStatus: submission.evaluationStatus
          } : null,
          isStarted: submission ? !!submission.startedAt : false,
          canStart: canStart
        };
      })
    );

    console.log('✅ [ASSIGNMENTS] Returning assignments with status:', assignmentsWithStatus.length);

    res.json({
      success: true,
      count: assignmentsWithStatus.length,
      data: assignmentsWithStatus
    });

  } catch (error) {
    console.error('❌ [ASSIGNMENTS] Error fetching active assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active assignments',
      error: error.message
    });
  }
});

// Get a specific assignment for taking
router.get('/assignments/:id', auth, isStudent, async (req, res) => {
  try {
    const studentId = req.user.userId;
    const assignmentId = req.params.id;

    const assignment = await Assignment.findById(assignmentId)
      .populate('subject', 'name code')
      .populate('course', 'name');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if already submitted
    const submission = await AssignmentSubmission.findOne({
      assignmentId: assignment._id,
      studentId: studentId
    });

    if (submission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this assignment',
        submission: {
          submittedAt: submission.submittedAt,
          marks: submission.marks,
          evaluationStatus: submission.evaluationStatus
        }
      });
    }

    // Check if assignment is active and within time range
    const currentDate = new Date();
    if (!assignment.isActive || currentDate < assignment.startDate || currentDate > assignment.endDate) {
      return res.status(400).json({
        success: false,
        message: 'This assignment is not currently available'
      });
    }

    res.json({
      success: true,
      data: {
        ...assignment.toObject(),
        serverTime: currentDate
      }
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

// Start an assignment
router.post('/assignments/:id/start', auth, isStudent, async (req, res) => {
  try {
    const studentId = req.user.userId;
    const assignmentId = req.params.id;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if already submitted or started
    let existingSubmission = await AssignmentSubmission.findOne({
      assignmentId: assignment._id,
      studentId: studentId
    });

    if (existingSubmission) {
      // If already submitted, don't allow restart
      if (existingSubmission.submittedAt) {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted this assignment',
          startedAt: existingSubmission.startedAt,
          submittedAt: existingSubmission.submittedAt
        });
      }
      
      // If just started but not submitted, return the existing submission
      return res.json({
        success: true,
        message: 'Assignment already started. Continuing...',
        data: {
          submissionId: existingSubmission._id,
          startTime: existingSubmission.startedAt,
          endTime: new Date(existingSubmission.startedAt.getTime() + assignment.timeLimit * 60000),
          timeLimit: assignment.timeLimit,
          serverTime: new Date()
        }
      });
    }

    // Check if assignment is active and within time range
    const currentDate = new Date();
    if (!assignment.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This assignment is not active'
      });
    }

    if (currentDate < assignment.startDate) {
      return res.status(400).json({
        success: false,
        message: 'This assignment has not started yet'
      });
    }

    if (currentDate > assignment.endDate) {
      return res.status(400).json({
        success: false,
        message: 'This assignment has ended'
      });
    }

    // Create submission record with start time
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + assignment.timeLimit * 60000); // Add time limit in ms

    console.log('📝 Creating new submission record (START only, no submission yet)');
    console.log('   - startedAt:', startTime.toISOString());
    console.log('   - submittedAt: null (not submitted yet)');
    console.log('   - status: Will be "submitted" (default)');
    console.log('   - evaluationStatus: pending');

    const submission = new AssignmentSubmission({
      assignmentId: assignment._id,
      studentId: studentId,
      startedAt: startTime,
      submittedAt: null, // Explicitly set to null - not submitted yet!
      timeTaken: 0,
      submittedAnswers: [],
      evaluationStatus: 'pending',
      status: 'submitted' // This is mongoose default, but submission not actually done
    });

    await submission.save();
    
    console.log('✅ Submission record created (START phase)');
    console.log('   - Submission ID:', submission._id);
    console.log('   - submittedAt after save:', submission.submittedAt);

    res.json({
      success: true,
      message: 'Assignment started successfully',
      data: {
        submissionId: submission._id,
        startTime: startTime,
        endTime: endTime,
        timeLimit: assignment.timeLimit,
        serverTime: currentDate
      }
    });

  } catch (error) {
    console.error('Error starting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting assignment',
      error: error.message
    });
  }
});

// Submit assignment answers
router.post('/assignments/:id/submit', auth, isStudent, async (req, res) => {
  try {
    console.log('\n\n🚀🚀🚀 SUBMIT ROUTE HIT - VERSION 5.0 🚀🚀🚀\n');
    console.log('⏰ Current Server Time:', new Date().toISOString());
    
    const studentId = req.user.userId;
    const assignmentId = req.params.id;
    const { answers } = req.body;

    console.log('=== ASSIGNMENT SUBMISSION DEBUG ===');
    console.log('Assignment ID:', assignmentId);
    console.log('Student ID:', studentId);
    console.log('Request Body Keys:', Object.keys(req.body));
    console.log('Received answers count:', answers ? answers.length : 0);
    console.log('Answers type:', typeof answers);
    console.log('Is Array:', Array.isArray(answers));
    console.log('First answer sample:', answers && answers[0] ? JSON.stringify(answers[0], null, 2) : 'No answers');
    console.log('All answers:', JSON.stringify(answers, null, 2));

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      console.error('❌ VALIDATION FAILED: No answers provided');
      console.error('   - answers exists:', !!answers);
      console.error('   - is array:', Array.isArray(answers));
      console.error('   - length:', answers ? answers.length : 'N/A');
      return res.status(400).json({
        success: false,
        message: 'Please provide answers before submitting'
      });
    }

    console.log('✅ Validation passed - answers array has', answers.length, 'items');

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    console.log('✅ Assignment found:', assignment.title);

    // Find existing submission
    let submission = await AssignmentSubmission.findOne({
      assignmentId: assignment._id,
      studentId: studentId
    });

    console.log('📋 Submission check:', {
      exists: !!submission,
      submissionId: submission ? submission._id : null,
      submittedAt: submission ? submission.submittedAt : null,
      startedAt: submission ? submission.startedAt : null,
      hasAnswers: submission && submission.submittedAnswers ? submission.submittedAnswers.length : 0,
      status: submission ? submission.status : null,
      evaluationStatus: submission ? submission.evaluationStatus : null
    });

    // Check if already submitted (with submittedAt date)
    if (submission && submission.submittedAt) {
      console.log('⚠️ Found existing submission with submittedAt:', submission.submittedAt);
      console.log('   - Submission created at:', submission.createdAt);
      console.log('   - Started at:', submission.startedAt);
      console.log('   - Answers count:', submission.submittedAnswers ? submission.submittedAnswers.length : 0);
      
      // Additional check: If submission exists with submittedAt but no answers, allow resubmission
      if (!submission.submittedAnswers || submission.submittedAnswers.length === 0) {
        console.log('⚠️ Found submission with no answers - allowing resubmission by deleting old record');
        console.log('   - Deleting submission ID:', submission._id);
        await AssignmentSubmission.findByIdAndDelete(submission._id);
        console.log('   ✅ Old submission deleted');
        submission = null; // Reset to create new submission
      } else {
        // Valid submission exists with answers
        console.log('❌ Valid submission exists - rejecting new submission');
        return res.status(400).json({
          success: false,
          message: 'You have already submitted this assignment',
          submittedAt: submission.submittedAt
        });
      }
    } else if (submission) {
      console.log('📝 Found started submission (not yet submitted)');
      console.log('   - Will update this submission with answers');
    } else {
      console.log('✅ No existing submission found - will create new one');
    }

    console.log('📝 Processing answers...');
    
    // Process answers with question details
    const answersWithQuestions = answers.map((answer, idx) => {
      const question = assignment.questions.find(q => q._id.toString() === answer.questionId);
      
      // Log each answer processing
      console.log(`   Answer ${idx + 1}:`, {
        questionId: answer.questionId,
        receivedQuestionText: answer.questionText ? answer.questionText.substring(0, 50) + '...' : 'NOT PROVIDED',
        questionTextFromDB: question ? question.question.substring(0, 50) + '...' : 'NOT FOUND',
        hasAnswer: !!(answer.answer || answer.selectedOption)
      });
      
      return {
        questionId: answer.questionId,
        questionText: answer.questionText || (question ? question.question : ''),
        answer: answer.answer || '',
        selectedOption: answer.selectedOption || '',
        type: answer.type || (question ? question.type : ''),
        questionDetails: question ? {
          type: question.type,
          options: question.options || [],
          correctAnswer: question.correctAnswer,
          marks: question.marks
        } : null
      };
    });

    console.log('✅ Processed', answersWithQuestions.length, 'answers');
    console.log('First processed answer:', JSON.stringify(answersWithQuestions[0], null, 2));

    // Prepare submission data
    const currentTime = new Date();
    const startTime = submission ? submission.startedAt : (assignment.startDate ? new Date(assignment.startDate) : currentTime);
    const timeTakenSeconds = submission ? Math.floor((currentTime - submission.startedAt) / 1000) : 0;

    const submissionData = {
      submittedAnswers: answersWithQuestions,
      submittedAt: currentTime,
      timeTaken: timeTakenSeconds,
      status: 'submitted',
      evaluationStatus: 'pending'  // Changed from 'evaluating' - wait for admin to evaluate
    };

    if (!submission) {
      // Create new submission with all data at once
      console.log('📝 Creating new submission with answers...');
      submissionData.assignmentId = assignment._id;
      submissionData.studentId = studentId;
      submissionData.startedAt = startTime;
      
      submission = new AssignmentSubmission(submissionData);
    } else {
      // Update existing submission
      console.log('📝 Updating existing submission...');
      Object.assign(submission, submissionData);
    }

    console.log('💾 Saving submission...');
    console.log('   - Submission ID:', submission._id || 'NEW');
    console.log('   - Answers to save:', submission.submittedAnswers.length);
    console.log('   - submittedAt:', submission.submittedAt);
    console.log('   - startedAt:', submission.startedAt);
    console.log('   - status:', submission.status);
    console.log('   - First answer:', submission.submittedAnswers[0] ? {
      questionId: submission.submittedAnswers[0].questionId,
      hasAnswer: !!(submission.submittedAnswers[0].answer || submission.submittedAnswers[0].selectedOption),
      type: submission.submittedAnswers[0].type
    } : 'No answers');

    await submission.save();

    console.log('✅ SUBMISSION SAVED SUCCESSFULLY!');
    console.log('   - Saved submission ID:', submission._id);

    // Verify immediately
    const verify = await AssignmentSubmission.findById(submission._id);
    console.log('🔍 VERIFICATION - Reading back from DB:');
    console.log('   - Answers in DB:', verify.submittedAnswers.length);
    console.log('   - submittedAt in DB:', verify.submittedAt);
    console.log('   - startedAt in DB:', verify.startedAt);
    console.log('   - status in DB:', verify.status);
    console.log('   - First answer in DB:', verify.submittedAnswers[0] ? {
      questionId: verify.submittedAnswers[0].questionId,
      hasAnswer: !!(verify.submittedAnswers[0].answer || verify.submittedAnswers[0].selectedOption),
      type: verify.submittedAnswers[0].type
    } : 'No answers in DB!');

    res.json({
      success: true,
      message: 'Assignment submitted successfully. Waiting for evaluation.',
      data: {
        submissionId: submission._id,
        answersCount: submission.submittedAnswers.length
      }
    });

    // REMOVED: Auto-evaluation
    // Admin/Lecturer will manually trigger evaluation from the submissions page
    // evaluateSubmission(submission._id, assignment, answersWithQuestions).catch(err => {
    //   console.error('Error in background evaluation:', err);
    // });

  } catch (error) {
    console.error('❌ ERROR IN SUBMIT ROUTE:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error submitting assignment',
      error: error.message
    });
  }
});

// Get assignment result// Get assignment result
router.get('/assignments/:id/result', auth, isStudent, async (req, res) => {
  try {
    const studentId = req.user.userId;
    const assignmentId = req.params.id;

    const submission = await AssignmentSubmission.findOne({
      assignmentId: assignmentId,
      studentId: studentId
    }).populate({
      path: 'assignmentId',
      populate: {
        path: 'subject',
        select: 'name code'
      }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Get subject level
    const subjectLevel = await StudentSubjectLevel.findOne({
      studentId: studentId,
      subjectId: submission.assignmentId.subject._id
    });

    res.json({
      success: true,
      data: {
        submission: {
          submittedAt: submission.submittedAt,
          timeTaken: submission.timeTaken,
          marks: submission.marks,
          percentage: submission.percentage,
          level: submission.level,
          feedback: submission.feedback,
          evaluationStatus: submission.evaluationStatus,
          submittedAnswers: submission.submittedAnswers
        },
        assignment: {
          title: submission.assignmentId.title,
          maxMarks: submission.assignmentId.maxMarks,
          passingMarks: submission.assignmentId.passingMarks,
          subject: submission.assignmentId.subject,
          questions: submission.assignmentId.questions
        },
        subjectPerformance: subjectLevel ? {
          averageMarks: subjectLevel.averageMarks,
          averagePercentage: subjectLevel.averagePercentage,
          level: subjectLevel.level,
          totalAssignments: subjectLevel.completedAssignments
        } : null
      }
    });

  } catch (error) {
    console.error('Error fetching assignment result:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignment result',
      error: error.message
    });
  }
});

// Get subject performance
router.get('/subjects/:id/performance', auth, isStudent, async (req, res) => {
  try {
    const studentId = req.user.userId;
    const subjectId = req.params.id;

    const subjectLevel = await StudentSubjectLevel.findOne({
      studentId: studentId,
      subjectId: subjectId
    }).populate('subjectId', 'name code');

    if (!subjectLevel) {
      return res.status(404).json({
        success: false,
        message: 'No performance data found for this subject'
      });
    }

    // Get all submissions for this subject
    const submissions = await AssignmentSubmission.find({
      studentId: studentId
    }).populate({
      path: 'assignmentId',
      match: { subject: subjectId },
      select: 'title maxMarks passingMarks dueDate'
    }).sort({ submittedAt: -1 });

    // Filter out null assignments (from populate match)
    const validSubmissions = submissions.filter(s => s.assignmentId !== null);

    res.json({
      success: true,
      data: {
        subject: subjectLevel.subjectId,
        performance: {
          averageMarks: subjectLevel.averageMarks,
          averagePercentage: subjectLevel.averagePercentage,
          level: subjectLevel.level,
          totalAssignments: subjectLevel.totalAssignments,
          completedAssignments: subjectLevel.completedAssignments,
          lastAssignmentDate: subjectLevel.lastAssignmentDate
        },
        levelHistory: subjectLevel.levelChanges,
        performanceHistory: subjectLevel.performanceHistory,
        submissions: validSubmissions.map(s => ({
          assignmentId: s.assignmentId._id,
          assignmentTitle: s.assignmentId.title,
          submittedAt: s.submittedAt,
          marks: s.marks,
          maxMarks: s.assignmentId.maxMarks,
          percentage: s.percentage,
          level: s.level,
          timeTaken: s.timeTaken
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching subject performance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subject performance',
      error: error.message
    });
  }
});

// Get all subject levels for student dashboard
router.get('/performance/overview', auth, isStudent, async (req, res) => {
  try {
    const studentId = req.user.userId;

    const subjectLevels = await StudentSubjectLevel.find({
      studentId: studentId
    }).populate('subjectId', 'name code')
    .sort({ averagePercentage: -1 });

    res.json({
      success: true,
      count: subjectLevels.length,
      data: subjectLevels.map(sl => ({
        subject: sl.subjectId,
        averageMarks: sl.averageMarks,
        averagePercentage: sl.averagePercentage,
        level: sl.level,
        completedAssignments: sl.completedAssignments,
        lastAssignmentDate: sl.lastAssignmentDate
      }))
    });

  } catch (error) {
    console.error('Error fetching performance overview:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching performance overview',
      error: error.message
    });
  }
});

// ====== Parameterized routes come LAST ======

// Get specific subject detail for a student
router.get('/:studentId/subjects/:subjectId', auth, async (req, res) => {
  try {
    const { studentId, subjectId } = req.params;
    
    // Ensure the user can only access their own data or is an admin
    if (req.user.userId !== studentId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own subjects.'
      });
    }

    // Get student details
    const student = await User.findById(studentId)
      .populate('batch')
      .populate('semester')
      .populate('course')
      .populate('department');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get the specific subject
    const subject = await Subject.findById(subjectId)
      .populate('departmentId', 'name code')
      .populate('courseId', 'name code')
      .populate('batchId', 'name code')
      .populate('semesterId', 'name')
      .populate('lecturerId', 'firstName lastName email');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Verify the subject belongs to the student's batch
    if (subject.batchId._id.toString() !== student.batch._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'This subject does not belong to your batch'
      });
    }

    // Get modules for this subject
    const modules = await Module.find({
      subject: subject._id,
      isActive: true
    }).sort({ order: 1 });

    // Get all assignments for this subject and student's batch
    const allAssignments = await Assignment.find({
      subject: subject._id,
      batch: student.batch._id,
      isActive: true
    })
      .populate('createdBy', 'firstName lastName')
      .sort({ dueDate: -1 });

    // Get all meetings for this subject and batch
    const allMeetings = await Meeting.find({
      subjectId: subject._id,
      batchId: student.batch._id
    })
      .populate('lecturerId', 'firstName lastName email')
      .populate('moduleIds', 'name moduleNumber code title')
      .sort({ meetingDate: -1, startTime: -1 });

    // Check submission status for each assignment
    const assignmentsWithStatus = await Promise.all(
      allAssignments.map(async (assignment) => {
        const submission = await AssignmentSubmission.findOne({
          assignmentId: assignment._id,
          studentId: studentId
        });

        return {
          _id: assignment._id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate,
          startDate: assignment.startDate,
          endDate: assignment.endDate,
          totalMarks: assignment.maxMarks,
          type: assignment.assignmentType,
          level: assignment.assignmentLevel,
          hasSubmitted: !!submission,
          submissionStatus: submission ? {
            submittedAt: submission.submittedAt,
            marks: submission.marks,
            percentage: submission.percentage,
            level: submission.level,
            evaluationStatus: submission.evaluationStatus
          } : null
        };
      })
    );

    // Group assignments and meetings by module
    const modulesWithContent = modules.map(module => {
      const moduleAssignments = assignmentsWithStatus.filter(a => 
        allAssignments.find(aa => 
          aa._id.toString() === a._id.toString() && 
          aa.modules && 
          aa.modules.some(m => m.toString() === module._id.toString())
        )
      );

      const moduleMeetings = allMeetings.filter(m => 
        m.moduleId && m.moduleId.toString() === module._id.toString()
      );

      return {
        _id: module._id,
        name: module.name || module.title,
        title: module.title,
        description: module.description,
        code: module.code,
        order: module.order,
        moduleNumber: module.order, // For compatibility
        duration: module.duration,
        documents: module.documents || [],
        video: module.video || null,
        assignments: moduleAssignments,
        meetings: moduleMeetings
      };
    });

    // Count statistics
    const pendingAssignments = assignmentsWithStatus.filter(a => !a.hasSubmitted).length;
    const completedAssignments = assignmentsWithStatus.filter(a => a.hasSubmitted).length;
    
    const scheduledMeetings = allMeetings.filter(m => m.status === 'scheduled').length;
    const completedMeetings = allMeetings.filter(m => m.status === 'completed').length;
    const upcomingMeetings = allMeetings.filter(m => {
      const meetingDateTime = new Date(m.meetingDate);
      if (m.startTime) {
        const startTime = new Date(m.startTime);
        meetingDateTime.setHours(startTime.getHours(), startTime.getMinutes());
      }
      return meetingDateTime > new Date() && m.status === 'scheduled';
    }).length;

    const subjectDetail = {
      _id: subject._id,
      name: subject.name,
      code: subject.code,
      description: subject.description,
      creditHours: subject.creditHours,
      department: subject.departmentId,
      course: subject.courseId,
      batch: subject.batchId,
      semester: subject.semesterId,
      lecturer: subject.lecturerId,
      modules: modulesWithContent,
      statistics: {
        moduleCount: modules.length,
        assignmentCount: assignmentsWithStatus.length,
        pendingAssignments,
        completedAssignments,
        meetingCount: allMeetings.length,
        scheduledMeetings,
        completedMeetings,
        upcomingMeetings
      },
      allAssignments: assignmentsWithStatus,
      allMeetings: allMeetings.map(m => ({
        _id: m._id,
        topic: m.topic,
        description: m.description,
        meetingDate: m.meetingDate,
        startTime: m.startTime,
        endTime: m.endTime,
        duration: m.duration,
        status: m.status,
        dailyRoomUrl: m.dailyRoomUrl,
        dailyRoomName: m.dailyRoomName,
        lecturerId: m.lecturerId,
        moduleIds: m.moduleIds,
        modules: m.moduleIds,
        studentCount: m.studentCount,
        startedAt: m.startedAt,
        endedAt: m.endedAt,
        meetingLink: m.meetingLink
      }))
    };

    res.json({
      success: true,
      data: subjectDetail
    });

  } catch (error) {
    console.error('Error fetching subject detail:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subject detail',
      error: error.message
    });
  }
});

// Get all subjects for a student
router.get('/:studentId/subjects', auth, async (req, res) => {
  try {
    const studentId = req.params.studentId;
    
    // Ensure the user can only access their own data or is an admin
    if (req.user.userId !== studentId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own subjects.'
      });
    }

    // Get student details with batch information
    const student = await User.findById(studentId)
      .populate('batch')
      .populate('semester')
      .populate('course')
      .populate('department');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (student.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'User is not a student'
      });
    }

    // Get all subjects for the student's batch and semester
    const subjects = await Subject.find({
      batchId: student.batch._id,
      semesterId: student.semester._id,
      isActive: true
    })
      .populate('departmentId', 'name code')
      .populate('courseId', 'name code')
      .populate('batchId', 'name code')
      .populate('semesterId', 'name')
      .populate('lecturerId', 'firstName lastName email');

    // For each subject, get modules, assignments, and meetings
    const subjectsWithDetails = await Promise.all(
      subjects.map(async (subject) => {
        // Get modules for this subject
        const modules = await Module.find({
          subject: subject._id,
          isActive: true
        }).sort({ order: 1 });

        // Get all assignments for this subject and batch
        const allAssignments = await Assignment.find({
          subject: subject._id,
          batch: student.batch._id,
          isActive: true
        })
          .populate('createdBy', 'firstName lastName')
          .sort({ dueDate: -1 });

        // Get all meetings for this subject and batch
        const allMeetings = await Meeting.find({
          subjectId: subject._id,
          batchId: student.batch._id
        })
          .populate('lecturerId', 'firstName lastName email')
          .populate('moduleIds', 'name moduleNumber code title')
          .sort({ meetingDate: -1, startTime: -1 });

        // Check submission status for each assignment
        const assignmentsWithStatus = await Promise.all(
          allAssignments.map(async (assignment) => {
            const submission = await AssignmentSubmission.findOne({
              assignmentId: assignment._id,
              studentId: studentId
            });

            return {
              _id: assignment._id,
              title: assignment.title,
              description: assignment.description,
              dueDate: assignment.dueDate,
              totalMarks: assignment.maxMarks,
              type: assignment.assignmentType,
              level: assignment.assignmentLevel,
              hasSubmitted: !!submission,
              submissionStatus: submission ? {
                submittedAt: submission.submittedAt,
                marks: submission.marks,
                percentage: submission.percentage
              } : null
            };
          })
        );

        // Group assignments by module if they have module references
        const modulesWithContent = modules.map(module => {
          const moduleAssignments = assignmentsWithStatus.filter(a => 
            allAssignments.find(aa => 
              aa._id.toString() === a._id.toString() && 
              aa.modules && 
              aa.modules.some(m => m.toString() === module._id.toString())
            )
          );

          const moduleMeetings = allMeetings.filter(m => 
            m.moduleId && m.moduleId.toString() === module._id.toString()
          );

          return {
            _id: module._id,
            name: module.name || module.title,
            title: module.title,
            description: module.description,
            code: module.code,
            order: module.order,
            moduleNumber: module.order, // For compatibility
            duration: module.duration,
            documents: module.documents || [],
            video: module.video || null,
            assignments: moduleAssignments,
            meetings: moduleMeetings
          };
        });

        // Count statistics
        const pendingAssignments = assignmentsWithStatus.filter(a => !a.hasSubmitted).length;
        const completedAssignments = assignmentsWithStatus.filter(a => a.hasSubmitted).length;
        
        const scheduledMeetings = allMeetings.filter(m => m.status === 'scheduled').length;
        const completedMeetings = allMeetings.filter(m => m.status === 'completed').length;
        const upcomingMeetings = allMeetings.filter(m => {
          const meetingDateTime = new Date(m.meetingDate);
          if (m.startTime) {
            const startTime = new Date(m.startTime);
            meetingDateTime.setHours(startTime.getHours(), startTime.getMinutes());
          }
          return meetingDateTime > new Date() && m.status === 'scheduled';
        }).length;

        return {
          _id: subject._id,
          name: subject.name,
          code: subject.code,
          description: subject.description,
          creditHours: subject.creditHours,
          department: subject.departmentId,
          course: subject.courseId,
          batch: subject.batchId,
          semester: subject.semesterId,
          lecturer: subject.lecturerId,
          modules: modulesWithContent,
          statistics: {
            moduleCount: modules.length,
            assignmentCount: assignmentsWithStatus.length,
            pendingAssignments,
            completedAssignments,
            meetingCount: allMeetings.length,
            scheduledMeetings,
            completedMeetings,
            upcomingMeetings
          },
          allAssignments: assignmentsWithStatus,
          allMeetings: allMeetings.map(m => ({
            _id: m._id,
            topic: m.topic,
            description: m.description,
            meetingDate: m.meetingDate,
            startTime: m.startTime,
            endTime: m.endTime,
            duration: m.duration,
            status: m.status,
            dailyRoomUrl: m.dailyRoomUrl,
            dailyRoomName: m.dailyRoomName,
            subjectId: subject._id,
            lecturerId: m.lecturerId,
            moduleIds: m.moduleIds,
            modules: m.moduleIds, // For compatibility
            studentCount: m.studentCount,
            startedAt: m.startedAt,
            endedAt: m.endedAt
          }))
        };
      })
    );

    res.json({
      success: true,
      count: subjectsWithDetails.length,
      data: subjectsWithDetails
    });

  } catch (error) {
    console.error('Error fetching student subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subjects',
      error: error.message
    });
  }
});

// Helper function to evaluate submission
async function evaluateSubmission(submissionId, assignment, answers) {
  try {
    const submission = await AssignmentSubmission.findById(submissionId);
    if (!submission) return;

    // Use the stored answers which now include complete question details
    const answersToEvaluate = submission.submittedAnswers;

    // Call AI service to evaluate with complete answer data
    const evaluation = await evaluateAssignment(assignment, answersToEvaluate);

    // Update submission with results
    submission.marks = evaluation.marks;
    submission.percentage = evaluation.percentage;
    submission.level = evaluation.level;
    submission.feedback = evaluation.feedback;
    submission.evaluationResponse = JSON.stringify(evaluation);
    submission.evaluationStatus = 'completed';
    submission.isAutoEvaluated = true;
    submission.gradedAt = new Date();
    submission.status = 'graded';

    // Update individual answer scores if provided by AI
    if (evaluation.questionEvaluations && Array.isArray(evaluation.questionEvaluations)) {
      evaluation.questionEvaluations.forEach((qEval, index) => {
        if (submission.submittedAnswers[index]) {
          submission.submittedAnswers[index].marksAwarded = qEval.marksAwarded;
          submission.submittedAnswers[index].isCorrect = qEval.isCorrect;
        }
      });
    }

    await submission.save();

    // Update student subject level
    await updateStudentSubjectLevel(
      submission.studentId,
      assignment.subject,
      {
        assignmentId: assignment._id,
        marks: evaluation.marks,
        maxMarks: assignment.maxMarks,
        percentage: evaluation.percentage,
        level: evaluation.level,
        completedAt: submission.submittedAt
      }
    );

  } catch (error) {
    console.error('Error evaluating submission:', error);
    
    // Update submission to show evaluation failed
    const submission = await AssignmentSubmission.findById(submissionId);
    if (submission) {
      submission.evaluationStatus = 'failed';
      submission.feedback = 'Automatic evaluation failed. Please contact your instructor.';
      await submission.save();
    }
  }
}

// Helper function to update student subject level
async function updateStudentSubjectLevel(studentId, subjectId, assignmentData) {
  try {
    let subjectLevel = await StudentSubjectLevel.findOne({
      studentId: studentId,
      subjectId: subjectId
    });

    if (!subjectLevel) {
      // Create new record
      subjectLevel = new StudentSubjectLevel({
        studentId: studentId,
        subjectId: subjectId,
        totalAssignments: 0,
        completedAssignments: 0,
        totalMarksObtained: 0,
        totalMaxMarks: 0
      });
    }

    // Update using the model method
    subjectLevel.updatePerformance(assignmentData);
    await subjectLevel.save();

  } catch (error) {
    console.error('Error updating student subject level:', error);
    throw error;
  }
}

// Get assignment result
router.get('/assignments/:id/result', auth, isStudent, async (req, res) => {
  try {
    const studentId = req.user.userId;
    const assignmentId = req.params.id;

    const submission = await AssignmentSubmission.findOne({
      assignmentId: assignmentId,
      studentId: studentId
    }).populate({
      path: 'assignmentId',
      populate: {
        path: 'subject',
        select: 'name code'
      }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Get subject level
    const subjectLevel = await StudentSubjectLevel.findOne({
      studentId: studentId,
      subjectId: submission.assignmentId.subject._id
    });

    res.json({
      success: true,
      data: {
        submission: {
          submittedAt: submission.submittedAt,
          timeTaken: submission.timeTaken,
          marks: submission.marks,
          percentage: submission.percentage,
          level: submission.level,
          feedback: submission.feedback,
          evaluationStatus: submission.evaluationStatus,
          submittedAnswers: submission.submittedAnswers
        },
        assignment: {
          title: submission.assignmentId.title,
          maxMarks: submission.assignmentId.maxMarks,
          passingMarks: submission.assignmentId.passingMarks,
          subject: submission.assignmentId.subject,
          questions: submission.assignmentId.questions
        },
        subjectPerformance: subjectLevel ? {
          averageMarks: subjectLevel.averageMarks,
          averagePercentage: subjectLevel.averagePercentage,
          level: subjectLevel.level,
          totalAssignments: subjectLevel.completedAssignments
        } : null
      }
    });

  } catch (error) {
    console.error('Error fetching assignment result:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignment result',
      error: error.message
    });
  }
});

// Get subject performance
router.get('/subjects/:id/performance', auth, isStudent, async (req, res) => {
  try {
    const studentId = req.user.userId;
    const subjectId = req.params.id;

    const subjectLevel = await StudentSubjectLevel.findOne({
      studentId: studentId,
      subjectId: subjectId
    }).populate('subjectId', 'name code');

    if (!subjectLevel) {
      return res.status(404).json({
        success: false,
        message: 'No performance data found for this subject'
      });
    }

    // Get all submissions for this subject
    const submissions = await AssignmentSubmission.find({
      studentId: studentId
    }).populate({
      path: 'assignmentId',
      match: { subject: subjectId },
      select: 'title maxMarks passingMarks dueDate'
    }).sort({ submittedAt: -1 });

    // Filter out null assignments (from populate match)
    const validSubmissions = submissions.filter(s => s.assignmentId !== null);

    res.json({
      success: true,
      data: {
        subject: subjectLevel.subjectId,
        performance: {
          averageMarks: subjectLevel.averageMarks,
          averagePercentage: subjectLevel.averagePercentage,
          level: subjectLevel.level,
          totalAssignments: subjectLevel.totalAssignments,
          completedAssignments: subjectLevel.completedAssignments,
          lastAssignmentDate: subjectLevel.lastAssignmentDate
        },
        levelHistory: subjectLevel.levelChanges,
        performanceHistory: subjectLevel.performanceHistory,
        submissions: validSubmissions.map(s => ({
          assignmentId: s.assignmentId._id,
          assignmentTitle: s.assignmentId.title,
          submittedAt: s.submittedAt,
          marks: s.marks,
          maxMarks: s.assignmentId.maxMarks,
          percentage: s.percentage,
          level: s.level,
          timeTaken: s.timeTaken
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching subject performance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subject performance',
      error: error.message
    });
  }
});

// Get all subject levels for student dashboard
router.get('/performance/overview', auth, isStudent, async (req, res) => {
  try {
    const studentId = req.user.userId;

    const subjectLevels = await StudentSubjectLevel.find({
      studentId: studentId
    }).populate('subjectId', 'name code')
    .sort({ averagePercentage: -1 });

    res.json({
      success: true,
      count: subjectLevels.length,
      data: subjectLevels.map(sl => ({
        subject: sl.subjectId,
        averageMarks: sl.averageMarks,
        averagePercentage: sl.averagePercentage,
        level: sl.level,
        completedAssignments: sl.completedAssignments,
        lastAssignmentDate: sl.lastAssignmentDate
      }))
    });

  } catch (error) {
    console.error('Error fetching performance overview:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching performance overview',
      error: error.message
    });
  }
});

module.exports = router;
