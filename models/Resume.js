const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  originalText: {
    type: String,
    required: true
  },
  analysis: {
    toneScore: {
      type: Number,
      min: 0,
      max: 10
    },
    formattingScore: {
      type: Number,
      min: 0,
      max: 10
    },
    clarityScore: {
      type: Number,
      min: 0,
      max: 10
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 10
    },
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    detailedFeedback: String
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  analyzedAt: {
    type: Date
  }
});

// Add index for better query performance
resumeSchema.index({ uploadedAt: -1 });

module.exports = mongoose.model('Resume', resumeSchema);