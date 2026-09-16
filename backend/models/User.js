const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const experienceSchema = new mongoose.Schema({
    company: { type: String, required: true },
    role: { type: String, required: true },
    duration: { type: String, required: true },
    description: { type: String }
});

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    link: { type: String },
    description: { type: String }
});

const certificateSchema = new mongoose.Schema({
    title: { type: String, required: true },
    issuer: { type: String, required: true },
    date: { type: String },
    link: { type: String }
});

const jobMatchSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobListing', required: true },
    score: { type: Number, default: 0 },
    category: { 
        type: String, 
        enum: ['Strong Match', 'Good Match', 'Low Match'], 
        default: 'Low Match' 
    },
    matchedSkills: [{ type: String }],
    reasoning: { type: String },
    updatedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { 
        type: String, 
        enum: ['Candidate', 'Employer', 'Admin'], 
        default: 'Candidate' 
    },
    // Profile Management (Primarily for Candidates)
    isSingleName: { type: Boolean, default: false },
    phone: { type: String },
    location: { type: String },
    about: { type: String },
    skills: [{ type: String }],
    experience: [experienceSchema],
    projects: [projectSchema],
    certificates: [certificateSchema],
    resumeUrl: { type: String }, // Path to the uploaded resume
    resumeOriginalName: { type: String }, // Original filename of the resume
    jobMatches: [jobMatchSchema], // Persisted calculated job match scores
    
    // Employer specific
    companyName: { type: String }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
