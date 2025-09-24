"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const database_1 = require("../config/database");
const CacheService_1 = require("./CacheService");
const errorHandler_1 = require("../middleware/errorHandler");
class UserService {
    cacheService;
    constructor() {
        this.cacheService = new CacheService_1.CacheService();
    }
    async getAllUsers(filters) {
        const { page, limit, search, department } = filters;
        const offset = (page - 1) * limit;
        const where = {
            isActive: true
        };
        if (search) {
            where.OR = [
                { username: { contains: search, mode: 'insensitive' } },
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (department) {
            where.department = department;
        }
        const [users, total] = await Promise.all([
            database_1.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    fullName: true,
                    department: true,
                    position: true,
                    createdAt: true,
                    _count: {
                        select: { handovers: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit
            }),
            database_1.prisma.user.count({ where })
        ]);
        return {
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    async getUserById(id) {
        try {
            const cacheKey = `user:${id}`;
            const cached = await this.cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }
            const user = await database_1.prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    fullName: true,
                    department: true,
                    position: true,
                    createdAt: true,
                    updatedAt: true,
                    isActive: true,
                    _count: {
                        select: {
                            handovers: true,
                            comments: true,
                            shares: true
                        }
                    }
                }
            });
            if (user) {
                await this.cacheService.set(cacheKey, user, 3600);
            }
            return user;
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to fetch user', 500, 'FETCH_ERROR');
        }
    }
    async updateUser(id, data, userId) {
        try {
            if (id !== userId) {
                throw new errorHandler_1.AppError('Unauthorized to update this user', 403, 'UNAUTHORIZED');
            }
            const user = await database_1.prisma.user.update({
                where: { id },
                data: {
                    fullName: data.fullName,
                    department: data.department,
                    position: data.position,
                    updatedAt: new Date()
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    fullName: true,
                    department: true,
                    position: true,
                    createdAt: true,
                    updatedAt: true,
                    isActive: true
                }
            });
            await this.cacheService.invalidateUser(id);
            return user;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError('Failed to update user', 500, 'UPDATE_ERROR');
        }
    }
    async getUserHandovers(userId, filters) {
        try {
            const { page, limit, status } = filters;
            const offset = (page - 1) * limit;
            const where = {
                authorId: userId
            };
            if (status) {
                where.status = status;
            }
            const [handovers, total] = await Promise.all([
                database_1.prisma.handoverDocument.findMany({
                    where,
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                        category: true,
                        tags: true,
                        createdAt: true,
                        updatedAt: true,
                        completedAt: true,
                        _count: {
                            select: { comments: true, shares: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: offset,
                    take: limit
                }),
                database_1.prisma.handoverDocument.count({ where })
            ]);
            return {
                handovers,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to fetch user handovers', 500, 'FETCH_ERROR');
        }
    }
}
exports.UserService = UserService;
//# sourceMappingURL=UserService.js.map