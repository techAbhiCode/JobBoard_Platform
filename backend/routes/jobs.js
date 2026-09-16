const express = require('express');
const { getJobs, getJob, createJob, updateJob, deleteJob } = require('../controllers/jobs');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.route('/')
    .get(getJobs)
    .post(protect, authorize('Employer'), createJob);

router.route('/:id')
    .get(getJob)
    .put(protect, authorize('Employer', 'Admin'), updateJob)
    .delete(protect, authorize('Employer', 'Admin'), deleteJob);

module.exports = router;
