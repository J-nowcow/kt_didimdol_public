"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
exports.prisma = new client_1.PrismaClient({
    log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'info', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
    ],
});
if (process.env.NODE_ENV === 'development') {
    exports.prisma.$on('query', (e) => {
        logger_1.logger.debug('Database Query:', {
            query: e.query,
            params: e.params,
            duration: `${e.duration}ms`,
        });
    });
}
async function connectDatabase() {
    try {
        await exports.prisma.$connect();
        logger_1.logger.info('✅ PostgreSQL database connected successfully');
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to connect to PostgreSQL database:', error);
        throw error;
    }
}
async function disconnectDatabase() {
    try {
        await exports.prisma.$disconnect();
        logger_1.logger.info('✅ PostgreSQL database disconnected');
    }
    catch (error) {
        logger_1.logger.error('❌ Error disconnecting from PostgreSQL database:', error);
        throw error;
    }
}
//# sourceMappingURL=database.js.map