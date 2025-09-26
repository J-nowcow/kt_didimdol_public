import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

export let redis: RedisClientType;

export async function connectRedis(): Promise<void> {
  try {
    redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redis.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redis.on('connect', () => {
      logger.info('✅ Redis client connected');
    });

    redis.on('ready', () => {
      logger.info('✅ Redis client ready');
    });

    await redis.connect();
    logger.info('✅ Redis database connected successfully');
  } catch (error) {
    logger.error('❌ Failed to connect to Redis database:', error);
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  try {
    if (redis) {
      await redis.disconnect();
      logger.info('✅ Redis database disconnected');
    }
  } catch (error) {
    logger.error('❌ Error disconnecting from Redis database:', error);
    throw error;
  }
}
