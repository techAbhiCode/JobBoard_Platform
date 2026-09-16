const express = require('express');
const multer = require('multer');
const { protect, authorize } = require('../middlewares/auth');
const { analyzeResume, getMatchScore, getMyAnalysis, analyzeResumeDetailedController, getDetailedHistory } = require('../controllers/ai');

const router = express.Router();

// Memory storage for file upload (we pass buffer to pdf-parse)
const upload = multer({ storage: multer.memoryStorage() });

// AI Routes
router.post('/analyze-resume', protect, authorize('Candidate'), upload.single('resume'), analyzeResume);
router.post('/analyze-resume-detailed', protect, authorize('Candidate'), upload.single('resume'), analyzeResumeDetailedController);
router.get('/match/:jobId', protect, authorize('Candidate'), getMatchScore);
router.get('/my-analysis', protect, authorize('Candidate'), getMyAnalysis);
router.get('/detailed-history', protect, authorize('Candidate'), getDetailedHistory);

module.exports = router;
