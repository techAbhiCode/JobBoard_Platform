const { analyzeResumePdf, evaluateMatchScore, analyzeResumeDetailed } = require('../services/aiService');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const AIHistory = require('../models/AIHistory');

// @desc    Analyze uploaded resume PDF
// @route   POST /api/ai/analyze-resume
// @access  Private (Candidate)
exports.analyzeResume = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Please upload a PDF resume.' });
        }

        // Call the LangGraph workflow
        const analysis = await analyzeResumePdf(req.user.id, req.file.buffer);

        res.status(200).json({ success: true, data: analysis });
    } catch (err) {
        console.error("AI Service Error:", err);
        next(err);
    }
};

// @desc    Analyze uploaded resume PDF in detail with optional JD
// @route   POST /api/ai/analyze-resume-detailed
// @access  Private (Candidate)
exports.analyzeResumeDetailedController = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Please upload a PDF resume.' });
        }

        const { jobDescription } = req.body;

        // Call the detailed analysis workflow
        const analysis = await analyzeResumeDetailed(req.user.id, req.file.buffer, jobDescription);

        res.status(200).json({ success: true, data: analysis });
    } catch (err) {
        console.error("AI Detailed Service Error:", err);
        next(err);
    }
};

// @desc    Get match score for a job
// @route   GET /api/ai/match/:jobId
// @access  Private (Candidate)
exports.getMatchScore = async (req, res, next) => {
    try {
        const jobId = req.params.jobId;
        const matchResult = await evaluateMatchScore(req.user.id, jobId);

        res.status(200).json({ success: true, data: matchResult });
    } catch (err) {
        console.error("AI Match Error:", err);
        next(err);
    }
};

// @desc    Get candidate's latest resume analysis
// @route   GET /api/ai/my-analysis
// @access  Private (Candidate)
exports.getMyAnalysis = async (req, res, next) => {
    try {
        const analysis = await ResumeAnalysis.findOne({ userId: req.user.id });
        if (!analysis) {
            return res.status(200).json({ success: true, data: null, message: 'No analysis found.' });
        }
        res.status(200).json({ success: true, data: analysis });
    } catch (err) {
        next(err);
    }
};

// @desc    Get candidate's detailed resume history
// @route   GET /api/ai/detailed-history
// @access  Private (Candidate)
exports.getDetailedHistory = async (req, res, next) => {
    try {
        const history = await AIHistory.find({ 
            userId: req.user.id,
            'metadata.type': 'detailed_resume_scorer'
        }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: history });
    } catch (err) {
        next(err);
    }
};
