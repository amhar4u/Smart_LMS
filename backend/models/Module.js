const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Module title is required'],
    trim: true,
    minlength: [2, 'Module title must be at least 2 characters'],
    maxlength: [200, 'Module title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  subjectId: {
    type: String,
    required: [true, 'Subject ID is required']
  },
  order: {
    type: Number,
    required: [true, 'Module order is required'],
    min: [1, 'Order must be at least 1']
  },
  content: {
    type: String,
    trim: true
  },
  resources: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['pdf', 'video', 'link', 'document', 'other']
    }
  }],
  duration: {
    type: Number, // Duration in hours
    min: [0, 'Duration cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better performance
moduleSchema.index({ subjectId: 1 });
moduleSchema.index({ order: 1 });

module.exports = mongoose.model('Module', moduleSchema);
