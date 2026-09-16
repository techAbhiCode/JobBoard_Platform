const express = require('express');
const { getProfile, updateProfile, uploadResume, recalculateMatches } = require('../controllers/profile');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

router.route('/')
    .get(protect, getProfile)
    .put(protect, updateProfile);

router.post('/resume', protect, authorize('Candidate'), upload.single('resume'), uploadResume);
router.post('/recalculate-matches', protect, authorize('Candidate'), recalculateMatches);

module.exports = router;
