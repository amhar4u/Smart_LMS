const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const Subject = require('../models/Subject');
const Module = require('../models/Module');
const User = require('../models/User');
const dailyService = require('../services/dailyService');
const auth = require('../middleware/auth');
const { sendMeetingNotification } = require('../services/emailService');
const NotificationService = require('../services/notificationService');

/**
 * @route   POST /api/meetings
 * @desc    Create a new meeting
 * @access  Private (Lecturer only)
 */
router.post('/', auth, async (req, res) => {
  try {
    let {
      topic,
      description,
      departmentId,
      courseId,
      batchId,
      semesterId,
      subjectId,
      moduleIds,
      meetingDate,
      startTime,
      endTime,
      studentCount
    } = req.body;

    // Validate required fields (department, course, batch, semester are optional now)
    if (!topic || !description || !subjectId || !moduleIds || moduleIds.length === 0 || !meetingDate || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Topic, description, subject, modules, meeting date, and start time are required'
      });
    }

    // Get subject details to retrieve lecturer and auto-populate missing fields
    const subject = await Subject.findById(subjectId)
      .populate('departmentId')
      .populate('courseId')
      .populate('batchId')
      .populate('semesterId');
      
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Verify that the logged-in user is the lecturer for this subject
    if (subject.lecturerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to create meetings for this subject'
      });
    }

    // Auto-populate department, course, batch, semester from subject if not provided
    if (!departmentId && subject.departmentId) {
      departmentId = subject.departmentId._id || subject.departmentId;
    }
    if (!courseId && subject.courseId) {
      courseId = subject.courseId._id || subject.courseId;
    }
    if (!batchId && subject.batchId) {
      batchId = subject.batchId._id || subject.batchId;
    }
    if (!semesterId && subject.semesterId) {
      semesterId = subject.semesterId._id || subject.semesterId;
    }

    // Validate that we now have all required IDs
    if (!departmentId || !courseId || !batchId || !semesterId) {
      return res.status(400).json({
        success: false,
        message: 'Could not determine department, course, batch, or semester from subject'
      });
    }

    // Verify all modules exist
    const modules = await Module.find({ _id: { $in: moduleIds } });
    if (modules.length !== moduleIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more modules not found'
      });
    }

    // Create Daily room
    const roomOptions = {
      name: dailyService.generateRoomName(),
      privacy: 'public',
      properties: {
        enable_screenshare: true,
        enable_chat: true,
        // Removed enable_recording as it's not available in free plan
        exp: Math.floor(new Date(startTime).getTime() / 1000) + (60 * 60 * 4) // Expires 4 hours after start time
      }
    };

    const dailyRoom = await dailyService.createRoom(roomOptions);

    // Create meeting in database
    const meeting = new Meeting({
      topic,
      description,
      departmentId,
      courseId,
      batchId,
      semesterId,
      subjectId,
      lecturerId: subject.lecturerId,
      moduleIds,
      meetingDate: new Date(meetingDate),
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : undefined,
      studentCount: studentCount || 0,
      dailyRoomName: dailyRoom.roomName,
      dailyRoomUrl: dailyRoom.roomUrl,
      dailyRoomConfig: dailyRoom.room,
      status: 'scheduled'
    });

    await meeting.save();

    // Populate references before sending response
    const populatedMeeting = await Meeting.getMeetingWithDetails(meeting._id);

    // Send email notifications
    try {
      // Get lecturer for the subject
      const subjectWithLecturer = await Subject.findById(subjectId).populate('lecturerId', 'firstName lastName email');
      
      // Get enrolled students
      const enrolledStudents = await User.find({
        role: 'student',
        status: 'approved',
        isActive: true,
        batch: batchId,
        semester: semesterId
      }).select('firstName lastName email');

      console.log(`📧 [MEETING] Sending notifications for meeting: ${topic}`);
      
      // If created by admin, send to both lecturer and students
      if (req.user.role === 'admin') {
        // Send to lecturer
        if (subjectWithLecturer && subjectWithLecturer.lecturerId) {
          sendMeetingNotification(subjectWithLecturer.lecturerId, populatedMeeting, 'lecturer')
            .catch(err => console.error('Failed to send lecturer email:', err));
        }
        
        // Send to students
        console.log(`   Sending to ${enrolledStudents.length} students...`);
        enrolledStudents.forEach(student => {
          sendMeetingNotification(student, populatedMeeting, 'student')
            .catch(err => console.error(`Failed to send email to student ${student.email}:`, err));
        });
      } 
      // If created by lecturer, send only to students
      else if (req.user.role === 'teacher') {
        console.log(`   Sending to ${enrolledStudents.length} students...`);
        enrolledStudents.forEach(student => {
          sendMeetingNotification(student, populatedMeeting, 'student')
            .catch(err => console.error(`Failed to send email to student ${student.email}:`, err));
        });
      }
      
      // Send real-time notifications
      try {
        const io = req.app.get('io');
        const notificationService = new NotificationService(io);
        
        const lecturerId = subjectWithLecturer?.lecturerId?._id;
        const studentIds = enrolledStudents.map(s => s._id);
        
        if (req.user.role === 'admin') {
          // Admin created: notify both lecturer and students
          await notificationService.notifyMeetingScheduled(
            req.user._id,
            lecturerId ? [lecturerId, ...studentIds] : studentIds,
            meeting._id,
            topic,
            populatedMeeting.subjectId?.name || 'Unknown Subject',
            subjectId,
            meetingDate,
            startTime
          );
          console.log(`🔔 [MEETING] Notifications sent by admin to lecturer and ${enrolledStudents.length} students`);
        } else if (req.user.role === 'teacher') {
          // Lecturer created: notify only students
          await notificationService.notifyMeetingScheduled(
            req.user._id,
            studentIds,
            meeting._id,
            topic,
            populatedMeeting.subjectId?.name || 'Unknown Subject',
            subjectId,
            meetingDate,
            startTime
          );
          console.log(`🔔 [MEETING] Notifications sent by lecturer to ${enrolledStudents.length} students`);
        }
      } catch (notifError) {
        console.error('❌ Failed to send meeting notifications:', notifError);
      }
    } catch (emailError) {
      console.error('❌ [MEETING] Email notification error:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      meeting: populatedMeeting
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create meeting',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/meetings
 * @desc    Get all meetings (filtered by role)
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const { departmentId, courseId, batchId, semesterId, subjectId, status } = req.query;
    
    let query = { isActive: true };

    // If user is a lecturer, show only their meetings
    if (req.user.role === 'teacher') {
      query.lecturerId = req.user.id;
    }

    // Apply filters
    if (departmentId) query.departmentId = departmentId;
    if (courseId) query.courseId = courseId;
    if (batchId) query.batchId = batchId;
    if (semesterId) query.semesterId = semesterId;
    if (subjectId) query.subjectId = subjectId;
    if (status) query.status = status;

    const meetings = await Meeting.find(query)
      .populate('departmentId', 'name code')
      .populate('courseId', 'name code')
      .populate('batchId', 'name year maxStudents')
      .populate('semesterId', 'name number')
      .populate('subjectId', 'name code')
      .populate('lecturerId', 'firstName lastName email')
      .populate('moduleIds', 'name code title')
      .sort({ startTime: -1 });

    res.status(200).json({
      success: true,
      count: meetings.length,
      meetings
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meetings',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/meetings/:id
 * @desc    Get meeting by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const meeting = await Meeting.getMeetingWithDetails(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    res.status(200).json({
      success: true,
      meeting
    });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meeting',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/meetings/:id/can-start
 * @desc    Check if meeting can start now
 * @access  Private (Lecturer only)
 */
router.get('/:id/can-start', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Verify lecturer authorization
    if (meeting.lecturerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to start this meeting'
      });
    }

    const canStart = meeting.canStartNow();
    const now = new Date();
    const startTime = new Date(meeting.startTime);

    res.status(200).json({
      success: true,
      canStart,
      currentTime: now,
      scheduledTime: startTime,
      status: meeting.status
    });
  } catch (error) {
    console.error('Error checking meeting status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check meeting status',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/meetings/:id/start
 * @desc    Start a meeting
 * @access  Private (Lecturer only)
 */
router.post('/:id/start', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Verify lecturer authorization
    if (meeting.lecturerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to start this meeting'
      });
    }

    // Check if meeting can start
    if (!meeting.canStartNow()) {
      return res.status(400).json({
        success: false,
        message: 'Meeting cannot be started yet. Please wait until the scheduled time.'
      });
    }

    // Update meeting status
    meeting.status = 'ongoing';
    meeting.startedAt = new Date();
    await meeting.save();
    
    // Send real-time notifications when admin hosts meeting (lecturer absent scenario)
    if (req.user.role === 'admin' && meeting.lecturerId.toString() !== req.user.id) {
      try {
        const io = req.app.get('io');
        const notificationService = new NotificationService(io);
        
        // Get enrolled students
        const enrolledStudents = await User.find({
          role: 'student',
          status: 'approved',
          isActive: true,
          batch: meeting.batchId,
          semester: meeting.semesterId
        }).select('_id');
        
        // Get meeting details for notification
        const meetingDetails = await Meeting.findById(meeting._id)
          .populate('subjectId', 'name');
        
        const studentIds = enrolledStudents.map(s => s._id);
        const recipients = [meeting.lecturerId, ...studentIds];
        
        // Notify lecturer and students that admin has hosted the meeting
        await notificationService.createBulkNotifications(
          req.user._id,
          recipients,
          'meeting_hosted',
          'Meeting Started by Admin',
          `Admin has started the meeting "${meeting.topic}" for ${meetingDetails.subjectId?.name || 'your subject'}`,
          { 
            entityType: 'meeting', 
            entityId: meeting._id 
          },
          `/meetings/${meeting._id}`,
          'high',
          { 
            meetingTopic: meeting.topic,
            subjectName: meetingDetails.subjectId?.name,
            startedAt: meeting.startedAt
          }
        );
        
        console.log(`🔔 [MEETING] Admin hosted - notifications sent to lecturer and ${studentIds.length} students`);
      } catch (notifError) {
        console.error('❌ Failed to send meeting hosting notifications:', notifError);
      }
    }

    // Create meeting token for the lecturer
    const token = await dailyService.createMeetingToken(meeting.dailyRoomName, {
      userName: `${req.user.firstName} ${req.user.lastName}`,
      isOwner: true,
      enableRecording: true
    });

    res.status(200).json({
      success: true,
      message: 'Meeting started successfully',
      meeting,
      token: token.token,
      roomUrl: meeting.dailyRoomUrl
    });
  } catch (error) {
    console.error('Error starting meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start meeting',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/meetings/:id/end
 * @desc    End a meeting and update student count
 * @access  Private (Lecturer only)
 */
router.post('/:id/end', auth, async (req, res) => {
  try {
    const { studentCount } = req.body;
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Verify lecturer authorization
    if (meeting.lecturerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to end this meeting'
      });
    }

    // Update meeting status
    meeting.status = 'completed';
    meeting.endedAt = new Date();
    if (studentCount !== undefined && studentCount >= 0) {
      meeting.studentCount = studentCount;
    }
    await meeting.save();

    res.status(200).json({
      success: true,
      message: 'Meeting ended successfully',
      meeting
    });
  } catch (error) {
    console.error('Error ending meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end meeting',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/meetings/:id/join
 * @desc    Get meeting token for student to join
 * @access  Private (Student)
 */
router.post('/:id/join', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if meeting is ongoing
    if (meeting.status !== 'ongoing') {
      return res.status(400).json({
        success: false,
        message: 'Meeting is not currently active'
      });
    }

    // Create meeting token for the student
    const token = await dailyService.createMeetingToken(meeting.dailyRoomName, {
      userName: `${req.user.firstName} ${req.user.lastName}`,
      isOwner: false
    });

    res.status(200).json({
      success: true,
      message: 'Meeting token generated successfully',
      token: token.token,
      roomUrl: meeting.dailyRoomUrl,
      meeting: {
        topic: meeting.topic,
        description: meeting.description,
        startTime: meeting.startTime
      }
    });
  } catch (error) {
    console.error('Error joining meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join meeting',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/meetings/:id
 * @desc    Update meeting details
 * @access  Private (Lecturer only)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Verify lecturer authorization
    if (meeting.lecturerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this meeting'
      });
    }

    // Only allow updates if meeting is scheduled
    if (meeting.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update meeting that has already started or ended'
      });
    }

    // Update allowed fields
    const { 
      topic, 
      description, 
      departmentId,
      courseId,
      batchId,
      semesterId,
      subjectId,
      meetingDate, 
      startTime, 
      endTime,
      moduleIds,
      studentCount,
      duration
    } = req.body;
    
    if (topic) meeting.topic = topic;
    if (description) meeting.description = description;
    if (departmentId) meeting.departmentId = departmentId;
    if (courseId) meeting.courseId = courseId;
    if (batchId) meeting.batchId = batchId;
    if (semesterId) meeting.semesterId = semesterId;
    if (subjectId) {
      meeting.subjectId = subjectId;
      // Update lecturer if subject changes
      const subject = await Subject.findById(subjectId);
      if (subject) {
        meeting.lecturerId = subject.lecturerId;
      }
    }
    if (meetingDate) meeting.meetingDate = new Date(meetingDate);
    if (startTime) meeting.startTime = new Date(startTime);
    if (endTime) meeting.endTime = new Date(endTime);
    if (moduleIds) meeting.moduleIds = moduleIds;
    if (studentCount !== undefined) meeting.studentCount = studentCount;

    await meeting.save();

    const updatedMeeting = await Meeting.getMeetingWithDetails(meeting._id);

    res.status(200).json({
      success: true,
      message: 'Meeting updated successfully',
      meeting: updatedMeeting
    });
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meeting',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/meetings/:id
 * @desc    Cancel/delete a meeting
 * @access  Private (Lecturer only)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Verify lecturer authorization
    if (meeting.lecturerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this meeting'
      });
    }

    // Update meeting status to cancelled
    meeting.status = 'cancelled';
    meeting.isActive = false;
    await meeting.save();

    // Optionally delete Daily room
    try {
      await dailyService.deleteRoom(meeting.dailyRoomName);
    } catch (error) {
      console.error('Error deleting Daily room:', error.message);
      // Continue even if room deletion fails
    }

    res.status(200).json({
      success: true,
      message: 'Meeting cancelled successfully'
    });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete meeting',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/meetings/subject/:subjectId/modules
 * @desc    Get modules for a subject
 * @access  Private
 */
router.get('/subject/:subjectId/modules', auth, async (req, res) => {
  try {
    const modules = await Module.findBySubject(req.params.subjectId);

    res.status(200).json({
      success: true,
      count: modules.length,
      modules
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch modules',
      error: error.message
    });
  }
});

module.exports = router;
