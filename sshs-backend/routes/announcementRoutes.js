const express = require('express');
const router = express.Router();
const {
  postAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  editAnnouncement,
  trackView,
} = require('../controllers/announcementsController');
const { protect, admin, teacherOrAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/multer');

// GET /api/announcements - Get all announcements (Pinned first, then newest)
router.get('/', protect, getAnnouncements);

// POST /api/announcements - Post a new announcement (Teacher or Admin)
// Uses 'upload.single' to handle the PDF file
router.post(
  '/',
  protect,
  teacherOrAdmin, 
  upload.single('file'),
  postAnnouncement
);

// PUT /api/announcements/:id - Edit an announcement (Admin Only)
// Allows replacing the file
router.put(
  '/:id',
  protect,
  admin, 
  upload.single('file'),
  editAnnouncement
);

// DELETE /api/announcements/:id - Delete an announcement (Admin Only)
router.delete('/:id', protect, admin, deleteAnnouncement);

// PUT /api/announcements/:id/view - Track that a student viewed the announcement
router.put('/:id/view', protect, trackView);

module.exports = router;