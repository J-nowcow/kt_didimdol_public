"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
class CacheService {
    async get(key) {
        try {
            const cached = await redis_1.redis.get(key);
            if (cached) {
                return JSON.parse(cached);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get from cache:', error);
            return null;
        }
    }
    async set(key, value, ttlSeconds = 3600) {
        try {
            await redis_1.redis.setEx(key, ttlSeconds, JSON.stringify(value));
        }
        catch (error) {
            logger_1.logger.error('Failed to set cache:', error);
        }
    }
    async del(key) {
        try {
            await redis_1.redis.del(key);
        }
        catch (error) {
            logger_1.logger.error('Failed to delete from cache:', error);
        }
    }
    async invalidateHandover(handoverId) {
        try {
            const keys = [
                `handover:${handoverId}`,
                `handover:${handoverId}:*`
            ];
            for (const key of keys) {
                await this.del(key);
            }
            logger_1.logger.info(`Invalidated cache for handover ${handoverId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to invalidate handover cache:', error);
        }
    }
    async invalidateUser(userId) {
        try {
            const keys = [
                `user:${userId}`,
                `user:${userId}:*`
            ];
            for (const key of keys) {
                await this.del(key);
            }
            logger_1.logger.info(`Invalidated cache for user ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to invalidate user cache:', error);
        }
    }
    async invalidateUserHandovers(userId) {
        try {
            const keys = [
                `user:${userId}:handovers`,
                `user:${userId}:handovers:*`
            ];
            for (const key of keys) {
                await this.del(key);
            }
            logger_1.logger.info(`Invalidated handovers cache for user ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to invalidate user handovers cache:', error);
        }
    }
    async cachePopularHandovers(handovers) {
        try {
            await this.set('popular:handovers', handovers, 1800);
            logger_1.logger.info('Cached popular handovers');
        }
        catch (error) {
            logger_1.logger.error('Failed to cache popular handovers:', error);
        }
    }
    async getPopularHandovers() {
        try {
            const cached = await this.get('popular:handovers');
            return cached || [];
        }
        catch (error) {
            logger_1.logger.error('Failed to get popular handovers from cache:', error);
            return [];
        }
    }
    async cacheUserHandovers(userId, handovers) {
        try {
            const key = `user:${userId}:handovers`;
            await this.set(key, handovers, 3600);
            logger_1.logger.info(`Cached handovers for user ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to cache user handovers:', error);
        }
    }
    async getUserHandovers(userId) {
        try {
            const key = `user:${userId}:handovers`;
            const cached = await this.get(key);
            return cached || [];
        }
        catch (error) {
            logger_1.logger.error('Failed to get user handovers from cache:', error);
            return [];
        }
    }
    async clearAll() {
        try {
            await redis_1.redis.flushAll();
            logger_1.logger.info('Cleared all cache');
        }
        catch (error) {
            logger_1.logger.error('Failed to clear all cache:', error);
        }
    }
    async deleteByPattern(pattern) {
        try {
            const keys = await redis_1.redis.keys(pattern);
            if (keys.length > 0) {
                await redis_1.redis.del(keys);
                logger_1.logger.info(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to delete cache by pattern:', error);
        }
    }
}
exports.CacheService = CacheService;
//# sourceMappingURL=CacheService.js.map