const express = require('express');
const router = express.Router();
const { 
  createPermit, 
  getPermits, 
  updatePermitStatus, 
  deletePermit 
} = require('../controllers/permitController');
const { protect, teacherOrAdmin, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/multer');

// GET /api/permits - Get permits (Filtered by role in controller)
router.get('/', protect, getPermits);

// POST /api/permits - Create a new permit request (Student)
// Handles the 'file' upload for medical certs/proof
router.post('/', protect, upload.single('file'), createPermit);

// PUT /api/permits/:id - Update status (Approve/Reject) (Teacher or Admin)
// This triggers the attendance update logic in the controller
router.put('/:id', protect, teacherOrAdmin, updatePermitStatus);

// DELETE /api/permits/:id - Delete a permit record (Admin Only)
router.delete('/:id', protect, admin, deletePermit);

module.exports = router;