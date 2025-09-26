import { Router } from 'express';
import { prisma } from '../config/database';
import { redis } from '../config/redis';

const router = Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    await redis.ping();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          redis: 'connected',
          server: 'running'
        }
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'One or more services are unavailable'
      }
    });
  }
});

export default router;
