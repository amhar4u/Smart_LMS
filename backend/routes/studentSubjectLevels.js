const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getStudentSubjectLevel,
  getStudentAllSubjectLevels,
  getSubjectStudentLevels
} = require('../services/studentSubjectLevelService');
const StudentSubjectLevel = require('../models/StudentSubjectLevel');

// GET /api/student-subject-levels/student/:studentId - Get all subjects for a student
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const levels = await getStudentAllSubjectLevels(studentId);

    res.json({
      success: true,
      message: 'Student subject levels retrieved successfully',
      data: levels
    });
  } catch (error) {
    console.error('Error retrieving student subject levels:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving student subject levels',
      error: error.message
    });
  }
});

// GET /api/student-subject-levels/subject/:subjectId - Get all students for a subject
router.get('/subject/:subjectId', auth, async (req, res) => {
  try {
    const { subjectId } = req.params;
    const levels = await getSubjectStudentLevels(subjectId);

    res.json({
      success: true,
      message: 'Subject student levels retrieved successfully',
      data: levels
    });
  } catch (error) {
    console.error('Error retrieving subject student levels:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving subject student levels',
      error: error.message
    });
  }
});

// GET /api/student-subject-levels/student/:studentId/subject/:subjectId - Get specific student-subject level
router.get('/student/:studentId/subject/:subjectId', auth, async (req, res) => {
  try {
    const { studentId, subjectId } = req.params;
    const level = await getStudentSubjectLevel(studentId, subjectId);

    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Student subject level not found'
      });
    }

    res.json({
      success: true,
      message: 'Student subject level retrieved successfully',
      data: level
    });
  } catch (error) {
    console.error('Error retrieving student subject level:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving student subject level',
      error: error.message
    });
  }
});

// GET /api/student-subject-levels/:id - Get by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const level = await StudentSubjectLevel.findById(req.params.id)
      .populate('studentId', 'firstName lastName email studentID')
      .populate('subjectId', 'name code')
      .populate('performanceHistory.assignmentId', 'title');

    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Student subject level not found'
      });
    }

    res.json({
      success: true,
      message: 'Student subject level retrieved successfully',
      data: level
    });
  } catch (error) {
    console.error('Error retrieving student subject level:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving student subject level',
      error: error.message
    });
  }
});

// GET /api/student-subject-levels - Get all (with filters)
router.get('/', auth, async (req, res) => {
  try {
    const { studentId, subjectId, level, minPercentage, maxPercentage } = req.query;
    
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (subjectId) filter.subjectId = subjectId;
    if (level) filter.level = level;
    
    if (minPercentage || maxPercentage) {
      filter.averagePercentage = {};
      if (minPercentage) filter.averagePercentage.$gte = parseFloat(minPercentage);
      if (maxPercentage) filter.averagePercentage.$lte = parseFloat(maxPercentage);
    }

    const levels = await StudentSubjectLevel.find(filter)
      .populate('studentId', 'firstName lastName email studentID')
      .populate('subjectId', 'name code')
      .sort({ averagePercentage: -1 });

    res.json({
      success: true,
      message: 'Student subject levels retrieved successfully',
      data: levels,
      count: levels.length
    });
  } catch (error) {
    console.error('Error retrieving student subject levels:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving student subject levels',
      error: error.message
    });
  }
});

// GET /api/student-subject-levels/student/:studentId/subject/:subjectId/history - Get performance history
router.get('/student/:studentId/subject/:subjectId/history', auth, async (req, res) => {
  try {
    const { studentId, subjectId } = req.params;
    const level = await StudentSubjectLevel.findOne({ studentId, subjectId })
      .populate('performanceHistory.assignmentId', 'title dueDate')
      .populate('studentId', 'firstName lastName')
      .populate('subjectId', 'name code');

    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'No performance history found'
      });
    }

    res.json({
      success: true,
      message: 'Performance history retrieved successfully',
      data: {
        student: level.studentId,
        subject: level.subjectId,
        currentLevel: level.level,
        averagePercentage: level.averagePercentage,
        performanceHistory: level.performanceHistory,
        levelChanges: level.levelChanges
      }
    });
  } catch (error) {
    console.error('Error retrieving performance history:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving performance history',
      error: error.message
    });
  }
});

// GET /api/student-subject-levels/statistics - Get overall statistics
router.get('/statistics/overview', auth, async (req, res) => {
  try {
    const { subjectId, studentId } = req.query;
    
    const matchFilter = {};
    if (subjectId) matchFilter.subjectId = mongoose.Types.ObjectId(subjectId);
    if (studentId) matchFilter.studentId = mongoose.Types.ObjectId(studentId);

    const stats = await StudentSubjectLevel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 },
          avgPercentage: { $avg: '$averagePercentage' },
          avgMarks: { $avg: '$averageMarks' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalStudents = stats.reduce((sum, stat) => sum + stat.count, 0);

    res.json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: {
        totalStudents,
        levelDistribution: stats,
        breakdown: {
          beginner: stats.find(s => s._id === 'beginner') || { count: 0, avgPercentage: 0 },
          intermediate: stats.find(s => s._id === 'intermediate') || { count: 0, avgPercentage: 0 },
          advanced: stats.find(s => s._id === 'advanced') || { count: 0, avgPercentage: 0 }
        }
      }
    });
  } catch (error) {
    console.error('Error retrieving statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving statistics',
      error: error.message
    });
  }
});

module.exports = router;
