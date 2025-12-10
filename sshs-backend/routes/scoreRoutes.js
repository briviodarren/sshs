const express = require('express');
const router = express.Router();
const {
  postScore,
  getClassScores,
  getStudentScores,
} = require('../controllers/scoresController');
const { protect, teacherOrAdmin } = require('../middleware/authMiddleware');

// GET /api/scores/my-scores - Student views their own scores
router.get('/my-scores', protect, getStudentScores);

// POST /api/scores - Teacher/Admin posts or updates a score
router.post('/', protect, teacherOrAdmin, postScore);

// GET /api/scores/class/:classId - Teacher/Admin views scores for a specific class
router.get('/class/:classId', protect, teacherOrAdmin, getClassScores);

module.exports = router;