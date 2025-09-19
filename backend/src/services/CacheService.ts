import { redis } from '../config/redis';
import { logger } from '../utils/logger';

export class CacheService {
  // 캐시에서 데이터 조회
  async get(key: string): Promise<any> {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logger.error('Failed to get from cache:', error);
      return null;
    }
  }

  // 캐시에 데이터 저장
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      await redis.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      logger.error('Failed to set cache:', error);
    }
  }

  // 캐시에서 데이터 삭제
  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error('Failed to delete from cache:', error);
    }
  }

  // 인수인계서 캐시 무효화
  async invalidateHandover(handoverId: number): Promise<void> {
    try {
      const keys = [
        `handover:${handoverId}`,
        `handover:${handoverId}:*`
      ];

      for (const key of keys) {
        await this.del(key);
      }

      logger.info(`Invalidated cache for handover ${handoverId}`);
    } catch (error) {
      logger.error('Failed to invalidate handover cache:', error);
    }
  }

  // 사용자 캐시 무효화
  async invalidateUser(userId: number): Promise<void> {
    try {
      const keys = [
        `user:${userId}`,
        `user:${userId}:*`
      ];

      for (const key of keys) {
        await this.del(key);
      }

      logger.info(`Invalidated cache for user ${userId}`);
    } catch (error) {
      logger.error('Failed to invalidate user cache:', error);
    }
  }

  // 사용자 인수인계서 캐시 무효화
  async invalidateUserHandovers(userId: number): Promise<void> {
    try {
      const keys = [
        `user:${userId}:handovers`,
        `user:${userId}:handovers:*`
      ];

      for (const key of keys) {
        await this.del(key);
      }

      logger.info(`Invalidated handovers cache for user ${userId}`);
    } catch (error) {
      logger.error('Failed to invalidate user handovers cache:', error);
    }
  }

  // 인기 인수인계서 캐시
  async cachePopularHandovers(handovers: any[]): Promise<void> {
    try {
      await this.set('popular:handovers', handovers, 1800); // 30분
      logger.info('Cached popular handovers');
    } catch (error) {
      logger.error('Failed to cache popular handovers:', error);
    }
  }

  // 인기 인수인계서 조회
  async getPopularHandovers(): Promise<any[]> {
    try {
      const cached = await this.get('popular:handovers');
      return cached || [];
    } catch (error) {
      logger.error('Failed to get popular handovers from cache:', error);
      return [];
    }
  }

  // 사용자별 인수인계서 캐시
  async cacheUserHandovers(userId: number, handovers: any[]): Promise<void> {
    try {
      const key = `user:${userId}:handovers`;
      await this.set(key, handovers, 3600); // 1시간
      logger.info(`Cached handovers for user ${userId}`);
    } catch (error) {
      logger.error('Failed to cache user handovers:', error);
    }
  }

  // 사용자별 인수인계서 조회
  async getUserHandovers(userId: number): Promise<any[]> {
    try {
      const key = `user:${userId}:handovers`;
      const cached = await this.get(key);
      return cached || [];
    } catch (error) {
      logger.error('Failed to get user handovers from cache:', error);
      return [];
    }
  }

  // 전체 캐시 클리어
  async clearAll(): Promise<void> {
    try {
      await redis.flushAll();
      logger.info('Cleared all cache');
    } catch (error) {
      logger.error('Failed to clear all cache:', error);
    }
  }

  // 패턴으로 캐시 삭제
  async deleteByPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
        logger.info(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      logger.error('Failed to delete cache by pattern:', error);
    }
  }
}
