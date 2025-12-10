const mongoose = require('mongoose');

const feeReliefSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  
  // --- Application Details ---
  reliefType: { 
    type: String, 
    enum: ['Partial Fee Reduction', 'Full Fee Waiver'], 
    required: true 
  },
  hardshipCategory: { 
    type: String, 
    enum: ['Parent Lost Job', 'Medical Emergency', 'Natural Disaster Impact', 'Single Parent', 'Income Instability'], 
    required: true 
  },
  
  // --- Household Financial Condition ---
  employmentStatus: { type: String, required: true }, // e.g. 'Unemployed', 'Retired'
  incomeRange: { 
    type: String, 
    enum: ['Very Low', 'Low', 'Medium', 'Above Medium'], 
    required: true 
  },
  dependents: { type: Number, required: true },
  
  // --- Payment Condition ---
  paymentCondition: { 
    type: String, 
    enum: ['Fully Unpaid', 'Partially Paid', 'Payment Delayed'], 
    required: true 
  },

  // --- Proof Files (Stored as a single Zip) ---
  fileUrl: { type: String, required: true },
  cloudinaryPublicId: { type: String, required: true },

  // --- Legal Declaration ---
  parentConsent: { type: Boolean, required: true },
  truthDeclaration: { type: Boolean, required: true },

  // --- Status Flow ---
  status: {
    type: String,
    enum: ['Submitted', 'Financial Verification', 'Approved', 'Rejected', 'Fee Adjustment Applied'],
    default: 'Submitted',
  }
}, { timestamps: true });

module.exports = mongoose.models.FeeRelief || mongoose.model('FeeRelief', feeReliefSchema);