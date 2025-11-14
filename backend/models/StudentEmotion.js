const mongoose = require('mongoose');

const studentEmotionSchema = new mongoose.Schema({
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  emotions: {
    happy: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    sad: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    angry: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    surprised: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    fearful: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    disgusted: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    neutral: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    }
  },
  dominantEmotion: {
    type: String,
    enum: ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral', 'unknown'],
    default: 'neutral'
  },
  faceDetected: {
    type: Boolean,
    default: false
  },
  attentiveness: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
    comment: 'Calculated based on face detection confidence and presence'
  },
  detectionConfidence: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
    comment: 'Face-API detection confidence score'
  },
  isPresent: {
    type: Boolean,
    default: true,
    comment: 'Whether student is actively in the meeting'
  },
  sessionId: {
    type: String,
    comment: 'Unique session identifier for this meeting attendance'
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
studentEmotionSchema.index({ meetingId: 1, studentId: 1, timestamp: -1 });
studentEmotionSchema.index({ meetingId: 1, timestamp: -1 });
studentEmotionSchema.index({ dominantEmotion: 1, meetingId: 1 });

// Static method to get emotion summary for a meeting
studentEmotionSchema.statics.getMeetingEmotionSummary = async function(meetingId) {
  const summary = await this.aggregate([
    { $match: { meetingId: mongoose.Types.ObjectId(meetingId) } },
    {
      $group: {
        _id: '$meetingId',
        avgHappy: { $avg: '$emotions.happy' },
        avgSad: { $avg: '$emotions.sad' },
        avgAngry: { $avg: '$emotions.angry' },
        avgNeutral: { $avg: '$emotions.neutral' },
        avgAttentiveness: { $avg: '$attentiveness' },
        totalRecords: { $sum: 1 },
        uniqueStudents: { $addToSet: '$studentId' }
      }
    }
  ]);

  return summary[0] || null;
};

// Static method to get student's emotion timeline
studentEmotionSchema.statics.getStudentTimeline = async function(meetingId, studentId) {
  return await this.find({
    meetingId: mongoose.Types.ObjectId(meetingId),
    studentId: mongoose.Types.ObjectId(studentId)
  })
  .sort({ timestamp: 1 })
  .select('timestamp emotions dominantEmotion attentiveness faceDetected');
};

// Static method to detect concerning patterns
studentEmotionSchema.statics.getAlerts = async function(meetingId) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  // Find students with prolonged negative emotions
  const negativeEmotions = await this.aggregate([
    {
      $match: {
        meetingId: mongoose.Types.ObjectId(meetingId),
        timestamp: { $gte: fiveMinutesAgo },
        $or: [
          { 'emotions.sad': { $gte: 0.5 } },
          { 'emotions.angry': { $gte: 0.5 } },
          { 'emotions.fearful': { $gte: 0.5 } }
        ]
      }
    },
    {
      $group: {
        _id: '$studentId',
        count: { $sum: 1 },
        avgSad: { $avg: '$emotions.sad' },
        avgAngry: { $avg: '$emotions.angry' },
        lastEmotion: { $last: '$dominantEmotion' }
      }
    },
    {
      $match: { count: { $gte: 2 } } // At least 2 consecutive negative readings
    }
  ]);

  // Find students with low attentiveness
  const lowAttentiveness = await this.aggregate([
    {
      $match: {
        meetingId: mongoose.Types.ObjectId(meetingId),
        timestamp: { $gte: fiveMinutesAgo },
        attentiveness: { $lte: 0.5 }
      }
    },
    {
      $group: {
        _id: '$studentId',
        avgAttentiveness: { $avg: '$attentiveness' },
        count: { $sum: 1 }
      }
    },
    {
      $match: { count: { $gte: 2 } }
    }
  ]);

  return {
    negativeEmotions,
    lowAttentiveness
  };
};

// Static method to get current engagement level
studentEmotionSchema.statics.getCurrentEngagement = async function(meetingId) {
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  
  const engagement = await this.aggregate([
    {
      $match: {
        meetingId: mongoose.Types.ObjectId(meetingId),
        timestamp: { $gte: twoMinutesAgo }
      }
    },
    {
      $group: {
        _id: '$studentId',
        latestAttentiveness: { $last: '$attentiveness' },
        latestEmotion: { $last: '$dominantEmotion' },
        latestTimestamp: { $last: '$timestamp' }
      }
    }
  ]);

  const totalStudents = engagement.length;
  const engaged = engagement.filter(e => e.latestAttentiveness >= 0.7).length;
  const avgEngagement = engagement.reduce((sum, e) => sum + e.latestAttentiveness, 0) / (totalStudents || 1);

  return {
    totalStudents,
    engaged,
    disengaged: totalStudents - engaged,
    avgEngagement: Math.round(avgEngagement * 100),
    students: engagement
  };
};

const StudentEmotion = mongoose.model('StudentEmotion', studentEmotionSchema);

module.exports = StudentEmotion;
