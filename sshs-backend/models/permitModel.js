const mongoose = require('mongoose');

const permitSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    class: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Class' 
      // Optional in schema, though our controller logic ensures it's populated for class-specific permits
    }, 
    isFullDay: { 
      type: Boolean, 
      default: false 
    },
    date: { 
      type: Date, 
      required: true 
    },
    reason: { 
      type: String, 
      required: true 
    },
    // Optional Proof (Medical Cert, etc.)
    fileUrl: { 
      type: String 
    }, 
    cloudinaryPublicId: { 
      type: String 
    },
    
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    reviewedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
  },
  { timestamps: true }
);

// Prevent OverwriteModelError
module.exports = mongoose.models.Permit || mongoose.model('Permit', permitSchema);