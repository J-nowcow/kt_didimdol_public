"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandoverController = void 0;
const HandoverService_1 = require("../services/HandoverService");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../utils/auth");
class HandoverController {
    handoverService;
    constructor() {
        this.handoverService = new HandoverService_1.HandoverService();
    }
    getAllHandovers = async (req, res) => {
        try {
            const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            const handovers = await this.handoverService.getAllHandovers({
                page: parseInt(page),
                limit: parseInt(limit),
                status: status,
                search: search,
                sortBy: sortBy,
                sortOrder: sortOrder,
                userId: (0, auth_1.requireUserId)(req)
            });
            res.json({
                success: true,
                data: handovers
            });
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to fetch handovers', 500, 'FETCH_ERROR');
        }
    };
    createHandover = async (req, res) => {
        try {
            const handoverData = {
                ...req.body,
                authorId: (0, auth_1.requireUserId)(req)
            };
            const handover = await this.handoverService.createHandover(handoverData);
            res.status(201).json({
                success: true,
                data: handover
            });
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to create handover', 500, 'CREATE_ERROR');
        }
    };
    getHandoverById = async (req, res) => {
        try {
            const { id } = req.params;
            const handover = await this.handoverService.getHandoverById(parseInt(id), (0, auth_1.requireUserId)(req));
            if (!handover) {
                throw new errorHandler_1.AppError('Handover not found', 404, 'NOT_FOUND');
            }
            res.json({
                success: true,
                data: handover
            });
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError('Failed to fetch handover', 500, 'FETCH_ERROR');
        }
    };
    updateHandover = async (req, res) => {
        try {
            const { id } = req.params;
            const handover = await this.handoverService.updateHandover(parseInt(id), req.body, (0, auth_1.requireUserId)(req));
            if (!handover) {
                throw new errorHandler_1.AppError('Handover not found', 404, 'NOT_FOUND');
            }
            res.json({
                success: true,
                data: handover
            });
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError('Failed to update handover', 500, 'UPDATE_ERROR');
        }
    };
    deleteHandover = async (req, res) => {
        try {
            const { id } = req.params;
            const success = await this.handoverService.deleteHandover(parseInt(id), (0, auth_1.requireUserId)(req));
            if (!success) {
                throw new errorHandler_1.AppError('Handover not found', 404, 'NOT_FOUND');
            }
            res.json({
                success: true,
                message: 'Handover deleted successfully'
            });
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError('Failed to delete handover', 500, 'DELETE_ERROR');
        }
    };
    createVersion = async (req, res) => {
        try {
            const { id } = req.params;
            const { changeSummary } = req.body;
            const version = await this.handoverService.createVersion(parseInt(id), changeSummary, (0, auth_1.requireUserId)(req));
            res.status(201).json({
                success: true,
                data: version
            });
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to create version', 500, 'CREATE_ERROR');
        }
    };
    getVersions = async (req, res) => {
        try {
            const { id } = req.params;
            const versions = await this.handoverService.getVersions(parseInt(id), (0, auth_1.requireUserId)(req));
            res.json({
                success: true,
                data: versions
            });
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to fetch versions', 500, 'FETCH_ERROR');
        }
    };
    shareHandover = async (req, res) => {
        try {
            const { id } = req.params;
            const { sharedWithUserId, permissionLevel, expiresAt } = req.body;
            const share = await this.handoverService.shareHandover(parseInt(id), Number(sharedWithUserId), String(permissionLevel), (0, auth_1.requireUserId)(req), expiresAt ? new Date(expiresAt) : undefined);
            res.status(201).json({
                success: true,
                data: share
            });
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to share handover', 500, 'SHARE_ERROR');
        }
    };
    getShares = async (req, res) => {
        try {
            const { id } = req.params;
            const shares = await this.handoverService.getShares(parseInt(id), (0, auth_1.requireUserId)(req));
            res.json({
                success: true,
                data: shares
            });
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to fetch shares', 500, 'FETCH_ERROR');
        }
    };
    deleteShare = async (req, res) => {
        try {
            const { id, shareId } = req.params;
            const success = await this.handoverService.deleteShare(parseInt(id), parseInt(shareId), (0, auth_1.requireUserId)(req));
            if (!success) {
                throw new errorHandler_1.AppError('Share not found', 404, 'NOT_FOUND');
            }
            res.json({
                success: true,
                message: 'Share deleted successfully'
            });
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError('Failed to delete share', 500, 'DELETE_ERROR');
        }
    };
    getComments = async (req, res) => {
        try {
            const { id } = req.params;
            const comments = await this.handoverService.getComments(parseInt(id), (0, auth_1.requireUserId)(req));
            res.json({
                success: true,
                data: comments
            });
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to fetch comments', 500, 'FETCH_ERROR');
        }
    };
    createComment = async (req, res) => {
        try {
            const { id } = req.params;
            const { content, parentCommentId } = req.body;
            const comment = await this.handoverService.createComment(parseInt(id), String(content), (0, auth_1.requireUserId)(req), typeof parentCommentId === 'number' ? parentCommentId : undefined);
            res.status(201).json({
                success: true,
                data: comment
            });
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to create comment', 500, 'CREATE_ERROR');
        }
    };
    updateComment = async (req, res) => {
        try {
            const { commentId } = req.params;
            const { content } = req.body;
            const comment = await this.handoverService.updateComment(parseInt(commentId), String(content), (0, auth_1.requireUserId)(req));
            if (!comment) {
                throw new errorHandler_1.AppError('Comment not found', 404, 'NOT_FOUND');
            }
            res.json({
                success: true,
                data: comment
            });
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError('Failed to update comment', 500, 'UPDATE_ERROR');
        }
    };
    deleteComment = async (req, res) => {
        try {
            const { commentId } = req.params;
            const success = await this.handoverService.deleteComment(parseInt(commentId), (0, auth_1.requireUserId)(req));
            if (!success) {
                throw new errorHandler_1.AppError('Comment not found', 404, 'NOT_FOUND');
            }
            res.json({
                success: true,
                message: 'Comment deleted successfully'
            });
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError('Failed to delete comment', 500, 'DELETE_ERROR');
        }
    };
}
exports.HandoverController = HandoverController;
//# sourceMappingURL=HandoverController.js.map