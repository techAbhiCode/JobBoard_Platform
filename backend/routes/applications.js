const express = require('express');
const { applyForJob, getMyApplications, getJobApplications, updateApplicationStatus } = require('../controllers/applications');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

router.post('/:jobId', protect, authorize('Candidate'), upload.single('resume'), applyForJob);
router.get('/me', protect, authorize('Candidate'), getMyApplications);
router.get('/jobs/:jobId', protect, authorize('Employer', 'Admin'), getJobApplications);
router.put('/:id', protect, authorize('Employer', 'Admin'), updateApplicationStatus);

module.exports = router;
