const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { getRedisClient } = require('../config/redis');

// Create Redis store with graceful fallback to MemoryStore
const createRedisStore = (prefix = 'rl:') => {
    try {
        const client = getRedisClient();
        if (client) {
            return new RedisStore({
                prefix,
                sendCommand: (...args) => client.call(...args)
            });
        }
    } catch (err) {
        console.warn('Redis rate limit store failed to initialize, falling back to memory store:', err.message);
    }
    return undefined; // Falls back to default express-rate-limit in-memory store
};

// Global rate limiter: 500 requests per 15 minutes per IP
const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('rl:global:'),
    message: {
        success: false,
        error: 'Too many requests from this IP. Please try again after 15 minutes.'
    }
});

// Auth rate limiter: 20 authentication attempts per 15 minutes per IP
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('rl:auth:'),
    message: {
        success: false,
        error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
    }
});

module.exports = {
    globalRateLimiter,
    authRateLimiter
};
