"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        await redis_1.redis.ping();
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
    }
    catch (error) {
        res.status(503).json({
            success: false,
            error: {
                code: 'SERVICE_UNAVAILABLE',
                message: 'One or more services are unavailable'
            }
        });
    }
});
exports.default = router;
//# sourceMappingURL=health.js.map