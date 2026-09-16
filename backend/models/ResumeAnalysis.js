const mongoose = require('mongoose');

const resumeAnalysisSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    overallScore: {
        type: Number,
        min: 0,
        max: 100
    },
    skills: [{ type: String }],
    experienceYears: { type: Number },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    actionableFeedback: { type: String },
    rawText: { type: String } // The extracted raw text from PDF
}, { timestamps: true });

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
