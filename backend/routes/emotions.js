const express = require('express');
const router = express.Router();
const StudentEmotion = require('../models/StudentEmotion');
const Meeting = require('../models/Meeting');
const auth = require('../middleware/auth');

// Store emotion data (HTTP fallback if WebSocket fails)
router.post('/meetings/:meetingId/emotions', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { emotions, dominantEmotion, faceDetected, confidence, sessionId } = req.body;
    const studentId = req.user.id;

    const emotionRecord = new StudentEmotion({
      meetingId,
      studentId,
      emotions,
      dominantEmotion,
      faceDetected,
      detectionConfidence: confidence || 0,
      attentiveness: faceDetected ? confidence : 0,
      isPresent: true,
      sessionId
    });

    await emotionRecord.save();

    res.status(201).json({
      success: true,
      message: 'Emotion data saved successfully',
      data: emotionRecord
    });
  } catch (error) {
    console.error('Error saving emotion data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save emotion data',
      error: error.message
    });
  }
});

// Get meeting emotion summary
router.get('/meetings/:meetingId/summary', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const summary = await StudentEmotion.getMeetingEmotionSummary(meetingId);

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'No emotion data found for this meeting'
      });
    }

    res.json({
      success: true,
      data: {
        meetingId,
        avgHappiness: Math.round(summary.avgHappy * 100),
        avgSadness: Math.round(summary.avgSad * 100),
        avgAnger: Math.round(summary.avgAngry * 100),
        avgNeutral: Math.round(summary.avgNeutral * 100),
        avgEngagement: Math.round(summary.avgAttentiveness * 100),
        totalRecords: summary.totalRecords,
        uniqueStudents: summary.uniqueStudents.length
      }
    });
  } catch (error) {
    console.error('Error fetching emotion summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emotion summary',
      error: error.message
    });
  }
});

// Get student emotion timeline for a meeting
router.get('/meetings/:meetingId/students/:studentId/timeline', auth, async (req, res) => {
  try {
    const { meetingId, studentId } = req.params;

    const timeline = await StudentEmotion.getStudentTimeline(meetingId, studentId);

    res.json({
      success: true,
      data: {
        meetingId,
        studentId,
        timeline,
        totalRecords: timeline.length
      }
    });
  } catch (error) {
    console.error('Error fetching student timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student timeline',
      error: error.message
    });
  }
});

// Get alerts for a meeting
router.get('/meetings/:meetingId/alerts', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const alerts = await StudentEmotion.getAlerts(meetingId);

    // Populate student details
    const negativeEmotions = await Promise.all(
      alerts.negativeEmotions.map(async (alert) => {
        const User = require('../models/User');
        const student = await User.findById(alert._id).select('firstName lastName email');
        return {
          studentId: alert._id,
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
          count: alert.count,
          avgSad: Math.round(alert.avgSad * 100),
          avgAngry: Math.round(alert.avgAngry * 100),
          lastEmotion: alert.lastEmotion
        };
      })
    );

    const lowAttentiveness = await Promise.all(
      alerts.lowAttentiveness.map(async (alert) => {
        const User = require('../models/User');
        const student = await User.findById(alert._id).select('firstName lastName email');
        return {
          studentId: alert._id,
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
          avgAttentiveness: Math.round(alert.avgAttentiveness * 100),
          count: alert.count
        };
      })
    );

    res.json({
      success: true,
      data: {
        meetingId,
        negativeEmotions,
        lowAttentiveness,
        totalAlerts: negativeEmotions.length + lowAttentiveness.length
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message
    });
  }
});

// Get current engagement for a meeting
router.get('/meetings/:meetingId/engagement', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const engagement = await StudentEmotion.getCurrentEngagement(meetingId);

    // Populate student details
    const studentsWithDetails = await Promise.all(
      engagement.students.map(async (student) => {
        const User = require('../models/User');
        const studentData = await User.findById(student._id).select('firstName lastName email');
        return {
          studentId: student._id,
          studentName: studentData ? `${studentData.firstName} ${studentData.lastName}` : 'Unknown',
          email: studentData?.email,
          attentiveness: Math.round(student.latestAttentiveness * 100),
          emotion: student.latestEmotion,
          lastUpdate: student.latestTimestamp
        };
      })
    );

    res.json({
      success: true,
      data: {
        meetingId,
        totalStudents: engagement.totalStudents,
        engaged: engagement.engaged,
        disengaged: engagement.disengaged,
        avgEngagement: engagement.avgEngagement,
        students: studentsWithDetails
      }
    });
  } catch (error) {
    console.error('Error fetching engagement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch engagement',
      error: error.message
    });
  }
});

// Get all emotions for a meeting (with pagination)
router.get('/meetings/:meetingId/all', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const emotions = await StudentEmotion.find({ meetingId })
      .populate('studentId', 'firstName lastName email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await StudentEmotion.countDocuments({ meetingId });

    res.json({
      success: true,
      data: {
        emotions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching emotions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emotions',
      error: error.message
    });
  }
});

// Update meeting emotion summary (called periodically)
router.post('/meetings/:meetingId/update-summary', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const summary = await StudentEmotion.getMeetingEmotionSummary(meetingId);

    if (summary) {
      await Meeting.findByIdAndUpdate(meetingId, {
        emotionSummary: {
          avgHappiness: Math.round(summary.avgHappy * 100),
          avgEngagement: Math.round(summary.avgAttentiveness * 100),
          alertsCount: 0, // Calculate separately if needed
          participantsTracked: summary.uniqueStudents.length,
          lastUpdated: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Meeting summary updated successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No emotion data found'
      });
    }
  } catch (error) {
    console.error('Error updating summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update summary',
      error: error.message
    });
  }
});

module.exports = router;
