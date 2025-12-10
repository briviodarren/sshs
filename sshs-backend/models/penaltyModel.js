const mongoose = require('mongoose');

const penaltySchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // 2. Violation Category
  violationCategory: { 
    type: String, 
    required: true,
    enum: [
      'Attendance Violation', 
      'Uniform Violation', 
      'Classroom Misconduct', 
      'Cheating / Academic Dishonesty', 
      'Bullying / Harassment', 
      'IT / Lab Misuse', 
      'Property Damage', 
      'Dormitory Violation'
    ]
  },

  // 3. Severity
  severityLevel: { 
    type: String, 
    required: true,
    enum: ['Minor', 'Moderate', 'Major']
  },

  // 4. Incident Date
  incidentDate: { type: Date, required: true },

  // 5. Issuing Authority
  issuingAuthorityType: { 
    type: String, 
    required: true,
    enum: ['Subject Teacher', 'Homeroom Teacher', 'Discipline Officer', 'Vice Principal', 'Admin Staff']
  },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // 6. Assigned Punishment
  assignedPunishment: { 
    type: String, 
    required: true,
    enum: [
      'Verbal Warning', 
      'Written Warning', 
      'Detention', 
      'Community Service', 
      'Parent Call / Meeting', 
      'Temporary Activity Ban', 
      'Suspension'
    ]
  },

  // 7. Execution Status
  executionStatus: { 
    type: String, 
    default: 'Pending',
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled']
  },

  // 8 & 9. Override Logic
  overrideAuthority: { 
    type: String, 
    default: 'No Override',
    enum: ['No Override', 'Teacher Override', 'Admin Override']
  },
  overrideReason: { 
    type: String,
    enum: ['Teacher Judgment', 'Administrative Decision', 'Evidence Review', 'Student Appeal', null],
    default: null
  },

  // 10. Evidence
  evidenceUrl: { type: String },
  cloudinaryPublicId: { type: String },

  // 12. System Status
  status: {
    type: String,
    default: 'Active',
    enum: ['Draft', 'Active', 'Under Review', 'Resolved', 'Cancelled']
  }
}, { timestamps: true });

module.exports = mongoose.models.Penalty || mongoose.model('Penalty', penaltySchema);