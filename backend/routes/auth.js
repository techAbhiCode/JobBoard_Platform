const express = require('express');
const { register, login, getMe } = require('../controllers/auth');
const { protect } = require('../middlewares/auth');
const { authRateLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.get('/me', protect, getMe);

module.exports = router;
