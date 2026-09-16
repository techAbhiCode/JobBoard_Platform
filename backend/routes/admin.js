const express = require('express');
const { 
    getStats, 
    getUsers, 
    getAdminStatus, 
    initAdmin, 
    adminLogin 
} = require('../controllers/admin');
const { protect, authorize } = require('../middlewares/auth');
const { authRateLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// Public Admin Auth & One-Time Setup Endpoints
router.get('/auth/status', getAdminStatus);
router.post('/auth/init', authRateLimiter, initAdmin);
router.post('/auth/login', authRateLimiter, adminLogin);

// Protected Admin Dashboard Endpoints
router.use(protect);
router.use(authorize('Admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);

module.exports = router;
