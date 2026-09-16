const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    jobId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'JobListing', 
        required: true 
    },
    candidateId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Accepted', 'Rejected'],
        default: 'Pending'
    },
    fullName: { type: String },
    isSingleName: { type: Boolean, default: false },
    phone: { type: String },
    location: { type: String },
    portfolioUrl: { type: String },
    yearsOfExperience: { type: String },
    noticePeriod: { type: String },
    coverLetter: { type: String },
    resumeUrl: { type: String } // Can be copied from candidate's profile at time of application or uploaded newly
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
