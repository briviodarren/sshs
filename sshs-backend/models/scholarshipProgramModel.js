const mongoose = require('mongoose');

const scholarshipProgramSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  
  // Configuration
  category: { 
    type: String, 
    enum: ['Academic', 'Sports', 'Arts', 'Leadership', 'Special Talent'], 
    required: true 
  },
  fundingType: { type: String, enum: ['Fully Funded', 'Partially Funded'], required: true },
  quota: { type: Number, required: true },
  
  // Eligibility Rules
  minScore: { type: Number, required: true }, 
  eligibleGrades: [{ type: Number }], // [10, 11, 12]
  
  // Timeline
  openDate: { type: Date, required: true },
  closeDate: { type: Date, required: true },
  
  // Status
  status: { 
    type: String, 
    enum: ['Draft', 'Active', 'Closed', 'Archived'], 
    default: 'Active' 
  },
  
  // Tracking
  applicantsCount: { type: Number, default: 0 },
  awardedCount: { type: Number, default: 0 },
}, { timestamps: true });

// Check mongoose.models first to prevent OverwriteModelError
module.exports = mongoose.models.ScholarshipProgram || mongoose.model('ScholarshipProgram', scholarshipProgramSchema);