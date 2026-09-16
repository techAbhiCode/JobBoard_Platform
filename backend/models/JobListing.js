const mongoose = require('mongoose');

const jobListingSchema = new mongoose.Schema({
    employerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    salary: { type: String },
    jobType: { 
        type: String, 
        enum: ['Full-Time', 'Part-Time', 'Contract', 'Internship'],
        default: 'Full-Time'
    },
    status: {
        type: String,
        enum: ['Open', 'Closed'],
        default: 'Open'
    },
    skillsRequired: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('JobListing', jobListingSchema);
