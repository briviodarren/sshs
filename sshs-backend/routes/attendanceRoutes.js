const express = require('express');
const router = express.Router();
const { 
  markAttendance, 
  getClassAttendance, 
  getStudentAttendance 
} = require('../controllers/attendanceController');
const { protect, teacherOrAdmin } = require('../middleware/authMiddleware');

// POST /api/attendance - Mark/Update attendance for a list of students
// Access: Teacher or Admin
router.post('/', protect, teacherOrAdmin, markAttendance);

// GET /api/attendance/class/:classId/:date - View attendance for a specific class on a specific date
// Access: Teacher or Admin
router.get('/class/:classId/:date', protect, teacherOrAdmin, getClassAttendance);

// GET /api/attendance/my-stats - View own attendance history and percentage
// Access: Student (Logged in user)
router.get('/my-stats', protect, getStudentAttendance);

module.exports = router;