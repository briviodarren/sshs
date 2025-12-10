const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  updateUserProfile, 
  getUsersByRole, 
  updateUserByAdmin,
  deleteUser,
  importUsers,
  saveFcmToken 
} = require('../controllers/authController');

const { protect, admin, teacherOrAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/multer');

// --- PUBLIC ROUTES ---
router.post('/register', registerUser);
router.post('/login', loginUser);

// --- PROTECTED ROUTES ---

// Profile & Notifications
router.put('/profile', protect, updateUserProfile);
router.put('/fcm-token', protect, saveFcmToken);

// --- ADMIN / TEACHER MANAGEMENT ROUTES ---

// Import Users from CSV (Admin Only)
router.post('/import', protect, admin, upload.single('file'), importUsers);

// Get Users (Teachers can view list to assign penalties/attendance)
router.get('/users/:role', protect, teacherOrAdmin, getUsersByRole);

// Edit/Delete User (Admin Only)
router.put('/users/:id', protect, admin, updateUserByAdmin);
router.delete('/users/:id', protect, admin, deleteUser);

module.exports = router;