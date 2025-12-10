const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  gradeLevel: { 
    type: Number, 
    required: true, 
    enum: [10, 11, 12] 
  },
  day: { 
    type: String, 
    required: true, 
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] 
  },
  startTime: { 
    type: String, 
    required: true 
  },
  endTime: { 
    type: String, 
    required: true 
  },
  
  // Replaces 'isMandatory' to support Majors
  category: { 
    type: String, 
    required: true, 
    enum: ['Mandatory', 'Science', 'Social'], 
    default: 'Mandatory'
  },

  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const Class = mongoose.model('Class', classSchema);
module.exports = Class;