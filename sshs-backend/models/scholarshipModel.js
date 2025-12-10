const mongoose = require('mongoose');

const scholarshipApplicationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  program: { type: mongoose.Schema.Types.ObjectId, ref: 'ScholarshipProgram', required: true },
  
  // Fields
  averageScore: { type: Number, required: true },
  gradeLevel: { type: Number },
  gender: { type: String },
  dob: { type: Date },
  firstTimeApplicant: { type: Boolean },
  
  // File (Single Zipped URL containing all uploaded docs)
  fileUrl: { type: String, required: true }, 
  cloudinaryPublicId: { type: String, required: true },

  // Legal
  dataAccuracyConfirmed: { type: Boolean, required: true },
  parentConsent: { type: Boolean, required: true },
  
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Approved', 'Rejected', 'Awarded'],
    default: 'Submitted',
  }
}, { timestamps: true });

// Check mongoose.models first to prevent OverwriteModelError
module.exports = mongoose.models.ScholarshipApplication || mongoose.model('ScholarshipApplication', scholarshipApplicationSchema);