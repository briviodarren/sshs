const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // The URL of the Zipped submission file
  fileUrl: {
    type: String,
    required: true
  },
  // Used for deleting the file from Cloudinary when the submission/user is deleted
  cloudinaryPublicId: { 
    type: String,
    required: true 
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure a student can only have one active submission document per assignment
// (Re-submissions update the existing document)
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

// Prevent OverwriteModelError
module.exports = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);