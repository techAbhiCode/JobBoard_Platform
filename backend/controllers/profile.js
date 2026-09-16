const User = require('../models/User');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const { recalculateAndStoreUserJobMatches } = require('../services/aiService');
const fs = require('fs');
const pdfParse = require('pdf-parse');

// @desc    Get current user profile
// @route   GET /api/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

// @desc    Update user profile (Candidate specific mostly)
// @route   PUT /api/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
    try {
        const { 
            about, 
            skills, 
            experience, 
            projects, 
            certificates, 
            companyName,
            isSingleName,
            phone,
            location
        } = req.body;

        // Fields to update
        const profileFields = {};
        if (about !== undefined) profileFields.about = about;
        if (skills !== undefined) profileFields.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
        if (experience !== undefined) profileFields.experience = experience;
        if (projects !== undefined) profileFields.projects = projects;
        if (certificates !== undefined) profileFields.certificates = certificates;
        if (isSingleName !== undefined) profileFields.isSingleName = Boolean(isSingleName);
        if (phone !== undefined) profileFields.phone = phone;
        if (location !== undefined) profileFields.location = location;
        
        // Employer specific
        if (companyName && req.user.role === 'Employer') profileFields.companyName = companyName;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: profileFields },
            { new: true, runValidators: true }
        );

        // Recalculate and store match scores in DB for candidates
        if (user.role === 'Candidate') {
            try {
                await recalculateAndStoreUserJobMatches(user._id);
                // Reload user to get updated jobMatches
                const updatedUser = await User.findById(user._id);
                return res.status(200).json({ success: true, data: updatedUser });
            } catch (matchErr) {
                console.warn("Match recalculation warning:", matchErr.message);
            }
        }

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

// @desc    Upload & persist candidate profile resume
// @route   POST /api/profile/resume
// @access  Private (Candidate)
exports.uploadResume = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Please select a resume file to upload' });
        }

        const resumeUrl = `/uploads/${req.file.filename}`;
        const resumeOriginalName = req.file.originalname;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        user.resumeUrl = resumeUrl;
        user.resumeOriginalName = resumeOriginalName;
        await user.save();

        // If file is PDF, parse text and store in ResumeAnalysis
        if (req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) {
            try {
                const fileBuffer = fs.readFileSync(req.file.path);
                const parsed = await pdfParse(fileBuffer);
                const rawText = parsed.text;

                let analysisDoc = await ResumeAnalysis.findOne({ userId: user._id });
                if (analysisDoc) {
                    analysisDoc.rawText = rawText;
                    await analysisDoc.save();
                } else {
                    await ResumeAnalysis.create({
                        userId: user._id,
                        overallScore: 75,
                        skills: user.skills || [],
                        experienceYears: 1,
                        strengths: ['Uploaded complete resume on profile'],
                        weaknesses: [],
                        actionableFeedback: 'Resume saved to profile.',
                        rawText
                    });
                }
            } catch (parseErr) {
                console.warn("Could not parse PDF text for profile resume:", parseErr.message);
            }
        }

        // Recalculate match scores in DB for all open jobs
        await recalculateAndStoreUserJobMatches(user._id);
        const updatedUser = await User.findById(user._id);

        res.status(200).json({
            success: true,
            data: updatedUser,
            message: 'Resume uploaded and stored in profile successfully. Job matches updated.'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Explicitly re-sync / recalculate stored job matches in DB
// @route   POST /api/profile/recalculate-matches
// @access  Private (Candidate)
exports.recalculateMatches = async (req, res, next) => {
    try {
        const matches = await recalculateAndStoreUserJobMatches(req.user.id);
        res.status(200).json({ success: true, count: matches.length, data: matches });
    } catch (err) {
        next(err);
    }
};
