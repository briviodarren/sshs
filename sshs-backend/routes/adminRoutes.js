const express = require('express');
const router = express.Router();
const { generateReport, resetAcademicYear } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// Generate CSV Report
router.post('/reports', protect, admin, generateReport);

// System Reset (New Year)
router.delete('/reset-year', protect, admin, resetAcademicYear);

module.exports = router;