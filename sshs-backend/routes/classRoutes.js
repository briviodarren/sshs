const express = require('express');
const router = express.Router();
const {
  createClass,
  getAllClasses,
  assignStudentToClass,
  assignTeacherToClass,
  updateClass,
  deleteClass,
  removeStudentFromClass,
  importClasses
} = require('../controllers/classController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/multer');

// GET /api/classes - Get all classes (Populated with teacher/students)
router.get('/', protect, getAllClasses);

// POST /api/classes - Create a new class
router.post('/', protect, admin, createClass);

// POST /api/classes/import - Bulk Import Classes from CSV
router.post('/import', protect, admin, upload.single('file'), importClasses);

// PUT /api/classes/assign-student - Enroll a student manually
router.put('/assign-student', protect, admin, assignStudentToClass);

// PUT /api/classes/assign-teacher - Assign a teacher manually
router.put('/assign-teacher', protect, assignTeacherToClass); // Note: Can be restricted to admin if needed, currently open to authenticated users for flexibility or restrict with 'admin' middleware

// PUT /api/classes/remove-student - Unenroll a student
router.put('/remove-student', protect, admin, removeStudentFromClass);

// PUT /api/classes/:id - Update class details (Name, Time, Teacher, etc.)
router.put('/:id', protect, admin, updateClass);

// DELETE /api/classes/:id - Delete a class (Cascade deletes all related data)
router.delete('/:id', protect, admin, deleteClass);

module.exports = router;