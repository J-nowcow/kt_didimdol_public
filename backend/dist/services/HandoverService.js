"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandoverService = void 0;
const database_1 = require("../config/database");
const MongoService_1 = require("./MongoService");
const CacheService_1 = require("./CacheService");
const errorHandler_1 = require("../middleware/errorHandler");
const mongoose_1 = require("mongoose");
class HandoverService {
    mongoService;
    cacheService;
    constructor() {
        this.mongoService = new MongoService_1.MongoService();
        this.cacheService = new CacheService_1.CacheService();
    }
    async getAllHandovers(filters) {
        const { page, limit, status, search, sortBy, sortOrder, userId } = filters;
        const offset = (page - 1) * limit;
        const where = {
            authorId: userId
        };
        if (status) {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } }
            ];
        }
        const orderBy = {};
        orderBy[sortBy || 'createdAt'] = sortOrder || 'desc';
        const [handovers, total] = await Promise.all([
            database_1.prisma.handoverDocument.findMany({
                where,
                include: {
                    author: {
                        select: { id: true, username: true, fullName: true, department: true }
                    },
                    _count: {
                        select: { comments: true, shares: true }
                    }
                },
                orderBy,
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
    async createHandover(data) {
        try {
            const mongoObjectId = new mongoose_1.Types.ObjectId().toHexString();
            const handover = await database_1.prisma.handoverDocument.create({
                data: {
                    title: data.title,
                    authorId: data.authorId,
                    status: data.status || 'draft',
                    priority: data.priority || 'medium',
                    category: data.category ?? null,
                    tags: data.tags ?? [],
                    mongoId: mongoObjectId
                },
                include: {
                    author: {
                        select: { id: true, username: true, fullName: true, department: true }
                    }
                }
            });
            try {
                await this.mongoService.createContent({
                    mongoId: mongoObjectId,
                    documentId: handover.id,
                    version: 1,
                    content: data.content,
                    createdBy: data.authorId
                });
            }
            catch (error) {
                await database_1.prisma.handoverDocument.delete({ where: { id: handover.id } });
                throw error;
            }
            await this.cacheService.invalidateUserHandovers(data.authorId);
            return handover;
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to create handover', 500, 'CREATE_ERROR');
        }
    }
    async getHandoverById(id, userId) {
        try {
            const cacheKey = `handover:${id}`;
            const cached = await this.cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }
            const handover = await database_1.prisma.handoverDocument.findFirst({
                where: {
                    id,
                    OR: [
                        { authorId: userId },
                        { shares: { some: { sharedWithUserId: userId } } }
                    ]
                },
                include: {
                    author: {
                        select: { id: true, username: true, fullName: true, department: true }
                    },
                    _count: {
                        select: { comments: true, shares: true }
                    }
                }
            });
            if (!handover) {
                return null;
            }
            const content = await this.mongoService.getContent(handover.mongoId);
            const result = { ...handover, content };
            await this.cacheService.set(cacheKey, result, 3600);
            return result;
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to fetch handover', 500, 'FETCH_ERROR');
        }
    }
    async updateHandover(id, data, userId) {
        try {
            const handover = await database_1.prisma.handoverDocument.findFirst({
                where: {
                    id,
                    OR: [
                        { authorId: userId },
                        { shares: { some: { sharedWithUserId: userId, permissionLevel: { in: ['write', 'admin'] } } } }
                    ]
                }
            });
            if (!handover) {
                return null;
            }
            const updatePayload = {
                ...(data.title !== undefined ? { title: data.title } : {}),
                ...(data.status !== undefined ? { status: data.status } : {}),
                ...(data.priority !== undefined ? { priority: data.priority } : {}),
                ...(data.category !== undefined ? { category: data.category ?? null } : {}),
                ...(data.tags !== undefined ? { tags: data.tags } : {}),
                updatedAt: new Date()
            };
            const updatedHandover = await database_1.prisma.handoverDocument.update({
                where: { id },
                data: updatePayload,
                include: {
                    author: {
                        select: { id: true, username: true, fullName: true, department: true }
                    }
                }
            });
            if (data.content) {
                const updatedContent = await this.mongoService.updateContent(handover.mongoId, data.content);
                if (!updatedContent) {
                    throw new errorHandler_1.AppError('Handover content not found', 404, 'CONTENT_NOT_FOUND');
                }
            }
            await this.cacheService.invalidateHandover(id);
            await this.cacheService.invalidateUserHandovers(userId);
            return updatedHandover;
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to update handover', 500, 'UPDATE_ERROR');
        }
    }
    async deleteHandover(id, userId) {
        try {
            const handover = await database_1.prisma.handoverDocument.findFirst({
                where: {
                    id,
                    authorId: userId
                }
            });
            if (!handover) {
                return false;
            }
            await Promise.all([
                database_1.prisma.handoverDocument.delete({ where: { id } }),
                this.mongoService.deleteContent(handover.mongoId)
            ]);
            await this.cacheService.invalidateHandover(id);
            await this.cacheService.invalidateUserHandovers(userId);
            return true;
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to delete handover', 500, 'DELETE_ERROR');
        }
    }
    async createVersion(documentId, changeSummary, userId) {
        try {
            const handover = await database_1.prisma.handoverDocument.findUnique({
                where: { id: documentId }
            });
            if (!handover) {
                throw new errorHandler_1.AppError('Handover not found', 404, 'NOT_FOUND');
            }
            const currentContent = await this.mongoService.getContent(handover.mongoId);
            if (!currentContent) {
                throw new errorHandler_1.AppError('Content not found', 404, 'CONTENT_NOT_FOUND');
            }
            const newMongoObjectId = new mongoose_1.Types.ObjectId().toHexString();
            await this.mongoService.createContent({
                mongoId: newMongoObjectId,
                documentId,
                version: currentContent.version + 1,
                content: currentContent.content,
                createdBy: userId
            });
            const version = await database_1.prisma.handoverVersion.create({
                data: {
                    documentId,
                    versionNumber: currentContent.version + 1,
                    mongoId: newMongoObjectId,
                    createdBy: userId,
                    changeSummary
                }
            });
            return version;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError('Failed to create version', 500, 'CREATE_ERROR');
        }
    }
    async getVersions(documentId, userId) {
        try {
            const handover = await database_1.prisma.handoverDocument.findFirst({
                where: {
                    id: documentId,
                    OR: [
                        { authorId: userId },
                        { shares: { some: { sharedWithUserId: userId } } }
                    ]
                }
            });
            if (!handover) {
                throw new errorHandler_1.AppError('Handover not found', 404, 'NOT_FOUND');
            }
            const versions = await database_1.prisma.handoverVersion.findMany({
                where: { documentId },
                include: {
                    creator: {
                        select: { id: true, username: true, fullName: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            return versions;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError('Failed to fetch versions', 500, 'FETCH_ERROR');
        }
    }
    async shareHandover(documentId, sharedWithUserId, permissionLevel, sharedBy, expiresAt) {
        try {
            const handover = await database_1.prisma.handoverDocument.findFirst({
                where: {
                    id: documentId,
                    authorId: sharedBy
                }
            });
            if (!handover) {
                throw new errorHandler_1.AppError('Handover not found', 404, 'NOT_FOUND');
            }
            const share = await database_1.prisma.handoverShare.create({
                data: {
                    documentId,
                    sharedWithUserId,
                    permissionLevel,
                    sharedBy,
                    expiresAt: expiresAt ?? null
                },
                include: {
                    sharedWithUser: {
                        select: { id: true, username: true, fullName: true, department: true }
                    }
                }
            });
            return share;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError('Failed to share handover', 500, 'SHARE_ERROR');
        }
    }
    async getShares(documentId, userId) {
        try {
            const handover = await database_1.prisma.handoverDocument.findFirst({
                where: {
                    id: documentId,
                    authorId: userId
                }
            });
            if (!handover) {
                throw new errorHandler_1.AppError('Handover not found', 404, 'NOT_FOUND');
            }
            const shares = await database_1.prisma.handoverShare.findMany({
                where: { documentId },
                include: {
                    sharedWithUser: {
                        select: { id: true, username: true, fullName: true, department: true }
                    }
                },
                orderBy: { sharedAt: 'desc' }
            });
            return shares;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError('Failed to fetch shares', 500, 'FETCH_ERROR');
        }
    }
    async deleteShare(documentId, shareId, userId) {
        try {
            const share = await database_1.prisma.handoverShare.findFirst({
                where: {
                    id: shareId,
                    documentId,
                    sharedBy: userId
                }
            });
            if (!share) {
                return false;
            }
            await database_1.prisma.handoverShare.delete({
                where: { id: shareId }
            });
            return true;
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to delete share', 500, 'DELETE_ERROR');
        }
    }
    async getComments(documentId, userId) {
        try {
            const handover = await database_1.prisma.handoverDocument.findFirst({
                where: {
                    id: documentId,
                    OR: [
                        { authorId: userId },
                        { shares: { some: { sharedWithUserId: userId } } }
                    ]
                }
            });
            if (!handover) {
                throw new errorHandler_1.AppError('Handover not found', 404, 'NOT_FOUND');
            }
            const comments = await database_1.prisma.handoverComment.findMany({
                where: {
                    documentId,
                    isDeleted: false
                },
                include: {
                    author: {
                        select: { id: true, username: true, fullName: true, department: true }
                    },
                    replies: {
                        where: { isDeleted: false },
                        include: {
                            author: {
                                select: { id: true, username: true, fullName: true, department: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'asc' }
            });
            return comments;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError('Failed to fetch comments', 500, 'FETCH_ERROR');
        }
    }
    async createComment(documentId, content, authorId, parentCommentId) {
        try {
            const handover = await database_1.prisma.handoverDocument.findFirst({
                where: {
                    id: documentId,
                    OR: [
                        { authorId },
                        { shares: { some: { sharedWithUserId: authorId } } }
                    ]
                }
            });
            if (!handover) {
                throw new errorHandler_1.AppError('Handover not found', 404, 'NOT_FOUND');
            }
            const comment = await database_1.prisma.handoverComment.create({
                data: {
                    documentId,
                    authorId,
                    content,
                    parentCommentId: parentCommentId ?? null
                },
                include: {
                    author: {
                        select: { id: true, username: true, fullName: true, department: true }
                    }
                }
            });
            return comment;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError('Failed to create comment', 500, 'CREATE_ERROR');
        }
    }
    async updateComment(commentId, content, userId) {
        try {
            const comment = await database_1.prisma.handoverComment.findFirst({
                where: {
                    id: commentId,
                    authorId: userId,
                    isDeleted: false
                }
            });
            if (!comment) {
                return null;
            }
            const updatedComment = await database_1.prisma.handoverComment.update({
                where: { id: commentId },
                data: { content, updatedAt: new Date() },
                include: {
                    author: {
                        select: { id: true, username: true, fullName: true, department: true }
                    }
                }
            });
            return updatedComment;
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to update comment', 500, 'UPDATE_ERROR');
        }
    }
    async deleteComment(commentId, userId) {
        try {
            const comment = await database_1.prisma.handoverComment.findFirst({
                where: {
                    id: commentId,
                    authorId: userId,
                    isDeleted: false
                }
            });
            if (!comment) {
                return false;
            }
            await database_1.prisma.handoverComment.update({
                where: { id: commentId },
                data: { isDeleted: true, updatedAt: new Date() }
            });
            return true;
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to delete comment', 500, 'DELETE_ERROR');
        }
    }
}
exports.HandoverService = HandoverService;
//# sourceMappingURL=HandoverService.js.map