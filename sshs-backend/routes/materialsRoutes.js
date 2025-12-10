const express = require('express');
const router = express.Router();
const {
  uploadMaterial,
  getMaterials,
  deleteMaterial,
  trackView,
  updateMaterial
} = require('../controllers/materialsController');
const { protect, teacher, teacherOrAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/multer');

// GET /api/materials - Get all materials (filtered by role in controller)
router.get('/', protect, getMaterials);

// POST /api/materials - Upload a new material (Teacher Only)
// Uses 'upload.single' to handle the file upload before the controller
router.post(
  '/', 
  protect, 
  teacher, 
  upload.single('file'), 
  uploadMaterial
);

// PUT /api/materials/:id - Edit a material (Teacher or Admin)
// Allows replacing the file and updating details
router.put(
  '/:id', 
  protect, 
  teacherOrAdmin, 
  upload.single('file'), 
  updateMaterial
);

// DELETE /api/materials/:id - Delete a material (Teacher or Admin)
router.delete('/:id', protect, teacherOrAdmin, deleteMaterial);

// PUT /api/materials/:id/view - Track a view (Any logged in user)
router.put('/:id/view', protect, trackView);

module.exports = router;