const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    type: {
      type: String,
      enum: ['Assignment', 'Midterm', 'Final'], 
      required: true,
    },
    // We use 'value' here to avoid naming conflicts (e.g. score.score)
    value: { 
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Prevent duplicate scores for the same Student + Class + Type
scoreSchema.index({ student: 1, class: 1, type: 1 }, { unique: true });

// Check mongoose.models first to prevent OverwriteModelError
module.exports = mongoose.models.Score || mongoose.model('Score', scoreSchema);