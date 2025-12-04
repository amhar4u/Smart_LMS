const express = require('express');
const router = express.Router();
const Doubt = require('../models/Doubt');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Notification = require('../models/Notification');
const authenticateToken = require('../middleware/auth');

// Get all doubts based on user role
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let query = {};
    const { status, subject, visibility, priority } = req.query;

    // Role-based filtering
    if (user.role === 'student') {
      // Students see: their private doubts + all public doubts in their batch
      query = {
        $or: [
          { student: user._id }, // Their own doubts
          { visibility: 'public', batch: user.batch } // Public doubts in their batch
        ]
      };
    } else if (user.role === 'lecturer') {
      // Lecturers see doubts assigned to them
      query.lecturer = user._id;
    } else if (user.role === 'admin') {
      // Admin sees all doubts (no filter needed)
    }

    // Apply additional filters
    if (status) query.status = status;
    if (subject) query.subject = subject;
    if (visibility) query.visibility = visibility;
    if (priority) query.priority = priority;

    const doubts = await Doubt.find(query)
      .populate('student', 'name email profilePicture')
      .populate('lecturer', 'name email')
      .populate('subject', 'name code')
      .populate('meeting', 'topic meetingDate')
      .populate('batch', 'name')
      .sort({ createdAt: -1 });

    res.json(doubts);
  } catch (error) {
    console.error('Error fetching doubts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get doubt statistics
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let filters = {};
    
    // Role-based filtering for statistics
    if (user.role === 'student') {
      filters.student = user._id;
    } else if (user.role === 'lecturer') {
      filters.lecturer = user._id;
    }
    // Admin sees all statistics (no filter)

    const stats = await Doubt.getStatistics(filters);
    const avgResponseTime = await Doubt.getAverageResponseTime(filters);

    res.json({
      ...stats,
      averageResponseTime: avgResponseTime
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single doubt by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const doubt = await Doubt.findById(req.params.id)
      .populate('student', 'name email profilePicture')
      .populate('lecturer', 'name email')
      .populate('subject', 'name code')
      .populate('meeting', 'topic meetingDate')
      .populate('batch', 'name');

    if (!doubt) {
      return res.status(404).json({ message: 'Doubt not found' });
    }

    // Check access permissions
    if (user.role === 'student') {
      if (doubt.student._id.toString() !== user._id.toString() && 
          (doubt.visibility !== 'public' || doubt.batch?.toString() !== user.batch?.toString())) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (user.role === 'lecturer') {
      if (doubt.lecturer._id.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Mark as read
    if (user.role === 'lecturer' && !doubt.isReadByLecturer) {
      doubt.isReadByLecturer = true;
      await doubt.save();
    } else if (user.role === 'student' && doubt.answer && !doubt.isReadByStudent) {
      doubt.isReadByStudent = true;
      await doubt.save();
    }

    res.json(doubt);
  } catch (error) {
    console.error('Error fetching doubt:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new doubt (Student only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can ask doubts' });
    }

    const { lecturer, subject, meeting, question, visibility, priority, tags } = req.body;

    // Validate required fields
    if (!lecturer || !subject || !question) {
      return res.status(400).json({ message: 'Lecturer, subject, and question are required' });
    }

    // Get lecturer details to verify
    console.log('Looking for lecturer with ID:', lecturer);
    const lecturerUser = await User.findById(lecturer);
    console.log('Found lecturer user:', lecturerUser);
    console.log('Lecturer role:', lecturerUser?.role);
    if (!lecturerUser || lecturerUser.role !== 'teacher') {
      console.log('Invalid lecturer - User not found or role is not teacher');
      return res.status(400).json({ message: 'Invalid lecturer' });
    }

    // Create the doubt
    const doubt = new Doubt({
      student: user._id,
      lecturer,
      subject,
      meeting: meeting || null,
      question,
      visibility: visibility || 'private',
      priority: priority || 'medium',
      tags: tags || [],
      batch: visibility === 'public' ? user.batch : null
    });

    await doubt.save();

    // Populate for response
    await doubt.populate('student', 'name email profilePicture');
    await doubt.populate('lecturer', 'name email');
    await doubt.populate('subject', 'name code');
    if (meeting) await doubt.populate('meeting', 'topic meetingDate');

    // Create notification for lecturer
    const notificationPriority = priority === 'high' ? 'high' : priority === 'low' ? 'low' : 'normal';
    const notification = new Notification({
      recipient: lecturer,
      sender: user._id,
      type: 'doubt_asked',
      title: 'New Doubt Received',
      message: `${user.firstName} ${user.lastName} asked a doubt in ${doubt.subject.name}`,
      relatedEntity: {
        entityType: 'Doubt',
        entityId: doubt._id
      },
      priority: notificationPriority
    });
    await notification.save();

    // Emit socket event for real-time update
    if (req.app.get('io')) {
      req.app.get('io').to(`user_${lecturerUser.firebaseUid}`).emit('newDoubt', doubt);
      req.app.get('io').emit('doubtUpdate', { action: 'created', doubt });
    }

    res.status(201).json(doubt);
  } catch (error) {
    console.error('Error creating doubt:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reply to a doubt (Lecturer only)
router.post('/:id/reply', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only lecturers can reply to doubts' });
    }

    const { answer } = req.body;

    if (!answer) {
      return res.status(400).json({ message: 'Answer is required' });
    }

    const doubt = await Doubt.findById(req.params.id)
      .populate('student', 'name email firebaseUid')
      .populate('lecturer', 'name email')
      .populate('subject', 'name code');

    if (!doubt) {
      return res.status(404).json({ message: 'Doubt not found' });
    }

    // Verify lecturer owns this doubt
    if (doubt.lecturer._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'You can only reply to your own assigned doubts' });
    }

    await doubt.markAsAnswered(answer);

    // Create notification for student
    const notification = new Notification({
      recipient: doubt.student._id,
      sender: user._id,
      type: 'doubt_answered',
      title: 'Your Doubt Has Been Answered',
      message: `${user.firstName} ${user.lastName} answered your doubt in ${doubt.subject.name}`,
      relatedEntity: {
        entityType: 'Doubt',
        entityId: doubt._id
      },
      priority: 'high'
    });
    await notification.save();

    // Emit socket event for real-time update
    if (req.app.get('io')) {
      req.app.get('io').to(`user_${doubt.student.firebaseUid}`).emit('doubtAnswered', doubt);
      req.app.get('io').emit('doubtUpdate', { action: 'answered', doubt });
    }

    res.json(doubt);
  } catch (error) {
    console.error('Error replying to doubt:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update doubt status (Student: mark resolved, Lecturer: update status)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { status } = req.body;

    if (!status || !['pending', 'answered', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const doubt = await Doubt.findById(req.params.id)
      .populate('student', 'name firebaseUid')
      .populate('lecturer', 'name firebaseUid')
      .populate('subject', 'name code');

    if (!doubt) {
      return res.status(404).json({ message: 'Doubt not found' });
    }

    // Verify permissions
    const isStudent = doubt.student._id.toString() === user._id.toString();
    const isLecturer = doubt.lecturer._id.toString() === user._id.toString();

    if (!isStudent && !isLecturer && user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Students can only mark as resolved
    if (user.role === 'student' && status !== 'resolved') {
      return res.status(403).json({ message: 'Students can only mark doubts as resolved' });
    }

    if (status === 'resolved') {
      await doubt.markAsResolved();
    } else {
      doubt.status = status;
      await doubt.save();
    }

    // Emit socket event for real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('doubtUpdate', { action: 'statusChanged', doubt });
    }

    res.json(doubt);
  } catch (error) {
    console.error('Error updating doubt status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update doubt (Edit question - Student only, before answer)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can edit their doubts' });
    }

    const doubt = await Doubt.findById(req.params.id);

    if (!doubt) {
      return res.status(404).json({ message: 'Doubt not found' });
    }

    // Verify student owns this doubt
    if (doubt.student.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own doubts' });
    }

    // Can't edit if already answered
    if (doubt.answer) {
      return res.status(403).json({ message: 'Cannot edit doubt after it has been answered' });
    }

    const { question, priority, tags } = req.body;

    if (question) doubt.question = question;
    if (priority) doubt.priority = priority;
    if (tags) doubt.tags = tags;

    await doubt.save();

    await doubt.populate('student', 'name email profilePicture');
    await doubt.populate('lecturer', 'name email');
    await doubt.populate('subject', 'name code');

    res.json(doubt);
  } catch (error) {
    console.error('Error updating doubt:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete doubt (Student only, before answer)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user || (user.role !== 'student' && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const doubt = await Doubt.findById(req.params.id);

    if (!doubt) {
      return res.status(404).json({ message: 'Doubt not found' });
    }

    // Students can only delete their own unanswered doubts
    if (user.role === 'student') {
      if (doubt.student.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'You can only delete your own doubts' });
      }
      if (doubt.answer) {
        return res.status(403).json({ message: 'Cannot delete doubt after it has been answered' });
      }
    }

    await Doubt.findByIdAndDelete(req.params.id);

    // Emit socket event for real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('doubtUpdate', { action: 'deleted', doubtId: req.params.id });
    }

    res.json({ message: 'Doubt deleted successfully' });
  } catch (error) {
    console.error('Error deleting doubt:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get doubts by subject (for public forum view)
router.get('/subject/:subjectId/public', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const doubts = await Doubt.find({
      subject: req.params.subjectId,
      visibility: 'public',
      batch: user.batch,
      status: { $in: ['answered', 'resolved'] } // Only show answered public doubts
    })
      .populate('student', 'name profilePicture')
      .populate('subject', 'name code')
      .populate('meeting', 'topic')
      .sort({ createdAt: -1 });

    res.json(doubts);
  } catch (error) {
    console.error('Error fetching public doubts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single doubt with full details (for view details modal)
router.get('/:id/details', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const doubt = await Doubt.findById(req.params.id)
      .populate('student', 'name email profilePicture')
      .populate('lecturer', 'name email profilePicture')
      .populate('subject', 'name code')
      .populate('meeting', 'topic meetingDate')
      .populate('batch', 'name')
      .populate('replies.author', 'name role');

    if (!doubt) {
      return res.status(404).json({ message: 'Doubt not found' });
    }

    // Verify permissions
    const isStudent = doubt.student._id.toString() === user._id.toString();
    const isLecturer = doubt.lecturer._id.toString() === user._id.toString();
    const isPublicAndSameBatch = doubt.visibility === 'public' && doubt.batch && doubt.batch._id.toString() === user.batch?.toString();

    if (!isStudent && !isLecturer && !isPublicAndSameBatch && user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark as read
    if (isLecturer && !doubt.isReadByLecturer) {
      doubt.isReadByLecturer = true;
      await doubt.save();
    } else if (isStudent && doubt.answer && !doubt.isReadByStudent) {
      doubt.isReadByStudent = true;
      await doubt.save();
    }

    res.json(doubt);
  } catch (error) {
    console.error('Error fetching doubt details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add follow-up reply to a doubt (conversation thread)
router.post('/:id/follow-up', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Follow-up message is required' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ message: 'Follow-up message too long (max 2000 characters)' });
    }

    const doubt = await Doubt.findById(req.params.id)
      .populate('student', 'name email firebaseUid')
      .populate('lecturer', 'name email firebaseUid')
      .populate('subject', 'name code');

    if (!doubt) {
      return res.status(404).json({ message: 'Doubt not found' });
    }

    // Verify permissions - only student who asked or lecturer who answers can add follow-up
    const isStudent = doubt.student._id.toString() === user._id.toString();
    const isLecturer = doubt.lecturer._id.toString() === user._id.toString();

    if (!isStudent && !isLecturer) {
      return res.status(403).json({ message: 'Only the student or lecturer involved can add follow-up messages' });
    }

    // Can only add follow-up if the doubt has been answered
    if (!doubt.answer) {
      return res.status(400).json({ message: 'Cannot add follow-up before initial answer is provided' });
    }

    // Add the reply
    doubt.replies.push({
      author: user._id,
      authorRole: user.role === 'student' ? 'student' : 'teacher',
      message: message.trim(),
      createdAt: new Date()
    });

    // Mark as unread for the other party
    if (isStudent) {
      doubt.isReadByLecturer = false;
    } else {
      doubt.isReadByStudent = false;
    }

    await doubt.save();

    // Populate the new reply author
    await doubt.populate('replies.author', 'name role');

    // Create notification for the other party
    const recipientId = isStudent ? doubt.lecturer._id : doubt.student._id;
    const recipientFirebaseUid = isStudent ? doubt.lecturer.firebaseUid : doubt.student.firebaseUid;

    const notification = new Notification({
      recipient: recipientId,
      type: 'doubt_followup',
      title: isStudent ? 'Student Follow-up Question' : 'Lecturer Follow-up Response',
      message: `${user.firstName} ${user.lastName} added a follow-up to a doubt in ${doubt.subject.name}`,
      relatedEntity: {
        entityType: 'Doubt',
        entityId: doubt._id
      },
      priority: 'normal'
    });
    await notification.save();

    // Emit socket event for real-time update
    if (req.app.get('io')) {
      req.app.get('io').to(`user_${recipientFirebaseUid}`).emit('doubtFollowUp', doubt);
      req.app.get('io').emit('doubtUpdate', { action: 'followUp', doubt });
    }

    res.json(doubt);
  } catch (error) {
    console.error('Error adding follow-up:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
