const Redis = require('ioredis');

const redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    retryStrategy: (times) => {
        // limit retry delay to max 2 seconds
        return Math.min(times * 50, 2000);
    },
    maxRetriesPerRequest: 3
});

let isConnected = false;

redisClient.on('connect', () => {
    isConnected = true;
    console.log('Redis connected successfully.');
});

redisClient.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
        if (isConnected) {
            console.error('Redis disconnected. Waiting for reconnect...');
        }
        isConnected = false;
    } else {
        console.error('Redis error:', err.message);
    }
});

module.exports = {
    getRedisClient: () => redisClient,
    redisClient
};
