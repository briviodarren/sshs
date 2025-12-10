const express = require('express');
const router = express.Router();
const {
  postAssignment,
  getAssignments,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissions,
  getMySubmissions,
  downloadAllSubmissions,
} = require('../controllers/assignmentsController');
const { protect, teacher, teacherOrAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/multer');

// IMPORTANT: Place static routes (like /my-submissions) BEFORE dynamic routes (like /:id)
// otherwise "my-submissions" will be treated as an ID.

// GET /api/assignments/my-submissions - Student gets their own work
router.get('/my-submissions', protect, getMySubmissions);

// GET /api/assignments - Get all relevant assignments
router.get('/', protect, getAssignments);

// POST /api/assignments - Create assignment (Teacher Only)
router.post(
  '/', 
  protect, 
  teacher, 
  upload.single('file'), // Reference PDF
  postAssignment
);

// GET /api/assignments/:id/download-all - Download all students' work as ZIP (Teacher/Admin)
router.get('/:id/download-all', protect, teacherOrAdmin, downloadAllSubmissions);

// PUT /api/assignments/:id - Edit assignment (Teacher/Admin)
router.put(
  '/:id', 
  protect, 
  teacherOrAdmin, 
  upload.single('file'), // Optional new reference PDF
  updateAssignment
);

// DELETE /api/assignments/:id - Delete assignment (Teacher/Admin)
router.delete('/:id', protect, teacherOrAdmin, deleteAssignment);

// POST /api/assignments/:id/submit - Submit homework (Student)
router.post(
  '/:id/submit', 
  protect, 
  upload.single('file'), // Student's file (will be zipped)
  submitAssignment
);

// GET /api/assignments/:id/submissions - View submissions list (Teacher/Admin)
// (Also allows Student to check if they submitted, handled in controller logic)
router.get('/:id/submissions', protect, getSubmissions);

module.exports = router;