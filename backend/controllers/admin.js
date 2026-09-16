const User = require('../models/User');
const JobListing = require('../models/JobListing');
const Application = require('../models/Application');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Check if an Admin account has already been provisioned
// @route   GET /api/admin/auth/status
// @access  Public
exports.getAdminStatus = async (req, res, next) => {
    try {
        const existingAdmin = await User.findOne({ role: 'Admin' });
        res.status(200).json({
            success: true,
            hasAdmin: Boolean(existingAdmin),
            adminEmail: existingAdmin ? existingAdmin.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null
        });
    } catch (err) {
        next(err);
    }
};

// @desc    One-Time Master Admin Setup (Permanently locks once created)
// @route   POST /api/admin/auth/init
// @access  Public (Only when hasAdmin is false)
exports.initAdmin = async (req, res, next) => {
    try {
        const existingAdmin = await User.findOne({ role: 'Admin' });
        if (existingAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Master Admin account is already configured and permanently locked. Setup cannot be re-run.'
            });
        }

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, error: 'Full name, admin email, and password are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
        }

        let user = await User.findOne({ email });
        if (user) {
            user.name = name;
            user.role = 'Admin';
            user.password = password; // pre-save will hash
            await user.save();
        } else {
            user = await User.create({
                name,
                email,
                password,
                role: 'Admin'
            });
        }

        const token = generateToken(user._id);
        const userObj = user.toObject();
        delete userObj.password;

        res.status(201).json({
            success: true,
            message: 'Master Admin account initialized successfully. Admin portal is now locked.',
            token,
            user: userObj
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Dedicated Administrator Login
// @route   POST /api/admin/auth/login
// @access  Public
exports.adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide administrator email and password.' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid administrator credentials.' });
        }

        if (user.role !== 'Admin') {
            return res.status(403).json({ success: false, error: 'Access denied: This portal is strictly for authorized administrators.' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid administrator credentials.' });
        }

        const token = generateToken(user._id);
        const userObj = user.toObject();
        delete userObj.password;

        res.status(200).json({ success: true, token, user: userObj });
    } catch (err) {
        next(err);
    }
};

// @desc    Get platform statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getStats = async (req, res, next) => {
    try {
        const usersCount = await User.countDocuments();
        const jobsCount = await JobListing.countDocuments();
        const applicationsCount = await Application.countDocuments();

        res.status(200).json({
            success: true,
            data: { usersCount, jobsCount, applicationsCount }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (err) {
        next(err);
    }
};
