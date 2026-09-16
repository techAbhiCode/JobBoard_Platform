const Application = require('../models/Application');
const JobListing = require('../models/JobListing');

// @desc    Apply for a job
// @route   POST /api/applications/:jobId
// @access  Private (Candidate)
exports.applyForJob = async (req, res, next) => {
    try {
        const jobId = req.params.jobId;
        const job = await JobListing.findById(jobId);
        
        if (!job) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        // Check if already applied
        const existingApp = await Application.findOne({ jobId, candidateId: req.user.id });
        if (existingApp) {
            return res.status(400).json({ success: false, error: 'You have already applied for this job' });
        }

        let resumeUrl = req.user.resumeUrl; // Auto-fetch profile resume by default
        if (req.file) {
            resumeUrl = `/uploads/${req.file.filename}`;
            // If requested or if user doesn't have a profile resume, update user's profile with this new resume
            if (req.body.updateProfileResume === 'true' || !req.user.resumeUrl) {
                req.user.resumeUrl = resumeUrl;
                req.user.resumeOriginalName = req.file.originalname;
                await req.user.save();
            }
        }

        if (!resumeUrl) {
            return res.status(400).json({ success: false, error: 'A resume is required to apply. Please upload a resume or add one to your profile.' });
        }

        const application = await Application.create({
            jobId,
            candidateId: req.user.id,
            fullName: req.body.fullName || req.user.name,
            isSingleName: req.body.isSingleName === 'true' || req.body.isSingleName === true,
            phone: req.body.phone || req.user.phone,
            location: req.body.location || req.user.location,
            portfolioUrl: req.body.portfolioUrl,
            yearsOfExperience: req.body.yearsOfExperience,
            noticePeriod: req.body.noticePeriod,
            coverLetter: req.body.coverLetter,
            resumeUrl
        });

        res.status(201).json({ success: true, data: application });
    } catch (err) {
        next(err);
    }
};

// @desc    Get logged in user's applications
// @route   GET /api/applications/me
// @access  Private (Candidate)
exports.getMyApplications = async (req, res, next) => {
    try {
        const applications = await Application.find({ candidateId: req.user.id })
            .populate('jobId', 'title company location status');
        res.status(200).json({ success: true, count: applications.length, data: applications });
    } catch (err) {
        next(err);
    }
};

// @desc    Get applications for a specific job
// @route   GET /api/applications/jobs/:jobId
// @access  Private (Employer)
exports.getJobApplications = async (req, res, next) => {
    try {
        const job = await JobListing.findById(req.params.jobId);
        if (!job) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        // Verify employer owns the job
        if (job.employerId.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, error: 'Not authorized to view these applications' });
        }

        const applications = await Application.find({ jobId: req.params.jobId })
            .populate('candidateId', 'name email skills experience projects resumeUrl');

        res.status(200).json({ success: true, count: applications.length, data: applications });
    } catch (err) {
        next(err);
    }
};

// @desc    Update application status
// @route   PUT /api/applications/:id
// @access  Private (Employer)
exports.updateApplicationStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        let application = await Application.findById(req.params.id).populate('jobId');

        if (!application) {
            return res.status(404).json({ success: false, error: 'Application not found' });
        }

        // Verify employer owns the job
        if (application.jobId.employerId.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, error: 'Not authorized to update this application' });
        }

        application.status = status;
        await application.save();

        res.status(200).json({ success: true, data: application });
    } catch (err) {
        next(err);
    }
};
