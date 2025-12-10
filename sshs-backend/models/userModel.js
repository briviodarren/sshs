const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      required: true,
    },
    address: { type: String },
    
    // --- ACADEMIC INFO (For Students) ---
    gradeLevel: { 
      type: Number, 
      enum: [10, 11, 12], 
      default: null 
    },
    major: {
      type: String,
      enum: ['Science', 'Social', 'None'],
      default: 'None'
    },
    
    // --- RELATIONSHIPS ---
    classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    
    // --- NOTIFICATIONS ---
    // Stores multiple tokens to support notifications on multiple devices (Laptop, Phone, etc.)
    fcmTokens: [{ type: String }] 
  },
  { timestamps: true }
);

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;