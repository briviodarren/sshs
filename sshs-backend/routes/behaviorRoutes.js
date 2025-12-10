const express = require('express');
const router = express.Router();
const { 
  createCritique, getAllCritiques, getMyCritiques,
  assignPenalty, updatePenalty, deletePenalty, getPenalties 
} = require('../controllers/behaviorController');
const { protect, admin, teacherOrAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/multer');

// --- CRITIQUES ---
// Student: Post a new critique
router.post('/critique', protect, createCritique);

// Student: View their own critique history
router.get('/critique/my', protect, getMyCritiques);

// Admin: View all critiques from all students
router.get('/critique/all', protect, admin, getAllCritiques);


// --- PENALTIES ---
// Teacher/Admin: Assign a new penalty (supports 'evidence' file upload)
router.post('/penalty', protect, teacherOrAdmin, upload.single('evidence'), assignPenalty);

// All Roles: View penalties (Controller filters based on role)
router.get('/penalty', protect, getPenalties);

// Teacher/Admin: Update an existing penalty (supports replacing 'evidence')
router.put('/penalty/:id', protect, teacherOrAdmin, upload.single('evidence'), updatePenalty);

// Teacher/Admin: Delete a penalty
router.delete('/penalty/:id', protect, teacherOrAdmin, deletePenalty);

module.exports = router;