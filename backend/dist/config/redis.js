"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.connectRedis = connectRedis;
exports.disconnectRedis = disconnectRedis;
const redis_1 = require("redis");
const logger_1 = require("../utils/logger");
async function connectRedis() {
    try {
        exports.redis = (0, redis_1.createClient)({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        exports.redis.on('error', (err) => {
            logger_1.logger.error('Redis Client Error:', err);
        });
        exports.redis.on('connect', () => {
            logger_1.logger.info('✅ Redis client connected');
        });
        exports.redis.on('ready', () => {
            logger_1.logger.info('✅ Redis client ready');
        });
        await exports.redis.connect();
        logger_1.logger.info('✅ Redis database connected successfully');
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to connect to Redis database:', error);
        throw error;
    }
}
async function disconnectRedis() {
    try {
        if (exports.redis) {
            await exports.redis.disconnect();
            logger_1.logger.info('✅ Redis database disconnected');
        }
    }
    catch (error) {
        logger_1.logger.error('❌ Error disconnecting from Redis database:', error);
        throw error;
    }
}
//# sourceMappingURL=redis.js.map