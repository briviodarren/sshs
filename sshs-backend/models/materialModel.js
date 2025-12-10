const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    
    // Link to the specific Class (e.g., "Math 101")
    class: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Class', 
      required: true 
    },
    
    // Weekly Topic Filter (1-14)
    week: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 14 
    },

    uploadedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },

    // File Details (Always Zipped now)
    fileUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    fileType: { type: String }, // e.g., 'zip'

    // View Tracking
    views: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const Material = mongoose.model('Material', materialSchema);
module.exports = Material;