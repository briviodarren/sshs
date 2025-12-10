const express = require('express');
const router = express.Router();
const { 
  createProgram, getPrograms, updateProgram, deleteProgram,
  applyForScholarship, getApplications, updateApplicationStatus,
  applyFeeRelief, getFeeReliefs, updateFeeReliefStatus,
  updateFeeRelief, deleteFeeRelief // <-- Import new functions
} = require('../controllers/financeController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/multer');

// --- SCHOLARSHIP PROGRAMS ---
router.post('/programs', protect, admin, createProgram);
router.get('/programs', protect, getPrograms);
router.put('/programs/:id', protect, admin, updateProgram);
router.delete('/programs/:id', protect, admin, deleteProgram);

// --- SCHOLARSHIP APPLICATIONS ---
router.get('/applications', protect, getApplications);
router.put('/applications/:id', protect, admin, updateApplicationStatus);
router.post('/apply', protect, upload.fields([
    { name: 'identityDoc', maxCount: 1 }, { name: 'proofDoc', maxCount: 1 }, { name: 'achievementDoc', maxCount: 1 }
]), applyForScholarship);

// --- FEE RELIEF ---
router.post('/fee-relief', protect, upload.fields([
    { name: 'incomeDoc', maxCount: 1 }, { name: 'terminationDoc', maxCount: 1 }, { name: 'medicalDoc', maxCount: 1 },
    { name: 'assistanceDoc', maxCount: 1 }, { name: 'disasterDoc', maxCount: 1 }
]), applyFeeRelief);

router.get('/fee-relief', protect, getFeeReliefs);
router.put('/fee-relief/:id/status', protect, admin, updateFeeReliefStatus); // Status only
router.put('/fee-relief/:id', protect, admin, updateFeeRelief); // Edit details
router.delete('/fee-relief/:id', protect, admin, deleteFeeRelief); // Delete

module.exports = router;