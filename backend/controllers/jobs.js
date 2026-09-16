const JobListing = require('../models/JobListing');
const { getRedisClient } = require('../config/redis');

// @desc    Get all jobs (with search/filter and Redis caching)
// @route   GET /api/jobs
// @access  Public
exports.getJobs = async (req, res, next) => {
    try {
        const { keyword, location, jobType } = req.query;
        let query = { status: 'Open' };

        if (keyword) {
            query.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
                { company: { $regex: keyword, $options: 'i' } }
            ];
        }
        if (location) query.location = { $regex: location, $options: 'i' };
        if (jobType) query.jobType = jobType;

        const cacheKey = `jobs:${JSON.stringify(query)}`;
        const redisClient = getRedisClient();

        if (redisClient && redisClient.status === 'ready') {
            const cachedJobs = await redisClient.get(cacheKey);
            if (cachedJobs) {
                return res.status(200).json({ success: true, data: JSON.parse(cachedJobs), cached: true });
            }
        }

        const jobs = await JobListing.find(query).sort('-createdAt');

        if (redisClient && redisClient.status === 'ready') {
            await redisClient.set(cacheKey, JSON.stringify(jobs), 'EX', 300); // 5 mins cache
        }

        res.status(200).json({ success: true, count: jobs.length, data: jobs });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
exports.getJob = async (req, res, next) => {
    try {
        const job = await JobListing.findById(req.params.id).populate('employerId', 'name companyName email');
        if (!job) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }
        res.status(200).json({ success: true, data: job });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Employer)
exports.createJob = async (req, res, next) => {
    try {
        req.body.employerId = req.user.id;
        // Optional: override company if not provided but exists in user profile
        if (!req.body.company && req.user.companyName) {
            req.body.company = req.user.companyName;
        }

        const job = await JobListing.create(req.body);
        
        // Invalidate cache
        const redisClient = getRedisClient();
        if (redisClient && redisClient.status === 'ready') {
            const keys = await redisClient.keys('jobs:*');
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        }

        res.status(201).json({ success: true, data: job });
    } catch (err) {
        next(err);
    }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Employer)
exports.updateJob = async (req, res, next) => {
    try {
        let job = await JobListing.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        // Make sure user is job owner
        if (job.employerId.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, error: 'User not authorized to update this job' });
        }

        job = await JobListing.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // Invalidate cache
        const redisClient = getRedisClient();
        if (redisClient && redisClient.status === 'ready') {
            const keys = await redisClient.keys('jobs:*');
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        }

        res.status(200).json({ success: true, data: job });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Employer/Admin)
exports.deleteJob = async (req, res, next) => {
    try {
        const job = await JobListing.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        if (job.employerId.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, error: 'User not authorized to delete this job' });
        }

        await job.deleteOne();

        // Invalidate cache
        const redisClient = getRedisClient();
        if (redisClient && redisClient.status === 'ready') {
            const keys = await redisClient.keys('jobs:*');
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};
