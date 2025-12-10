const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    instructions: { type: String },
    dueDate: { type: Date, required: true },
    
    // Relationships
    class: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Class', 
      required: true 
    },
    teacher: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },

    // Optional Reference File (PDF)
    fileUrl: { type: String },
    cloudinaryPublicId: { type: String },
  },
  { timestamps: true }
);

const Assignment = mongoose.model('Assignment', assignmentSchema);
module.exports = Assignment;