"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BackupService_1 = require("../services/BackupService");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
const backupService = new BackupService_1.BackupService();
router.post('/create', auth_1.authenticateToken, async (req, res) => {
    try {
        const backupId = await backupService.createFullBackup();
        res.status(201).json({
            success: true,
            data: {
                backupId,
                message: 'Backup created successfully'
            }
        });
    }
    catch (error) {
        throw new errorHandler_1.AppError('Failed to create backup', 500, 'BACKUP_ERROR');
    }
});
router.get('/list', auth_1.authenticateToken, async (req, res) => {
    try {
        const backups = await backupService.getBackupList();
        res.json({
            success: true,
            data: backups
        });
    }
    catch (error) {
        throw new errorHandler_1.AppError('Failed to get backup list', 500, 'FETCH_ERROR');
    }
});
router.get('/status', auth_1.authenticateToken, async (req, res) => {
    try {
        const status = await backupService.getBackupStatus();
        res.json({
            success: true,
            data: status
        });
    }
    catch (error) {
        throw new errorHandler_1.AppError('Failed to get backup status', 500, 'FETCH_ERROR');
    }
});
router.post('/restore/:backupId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { backupId } = req.params;
        const success = await backupService.restoreFromBackup(backupId);
        if (!success) {
            throw new errorHandler_1.AppError('Restore failed', 500, 'RESTORE_ERROR');
        }
        res.json({
            success: true,
            message: 'Data restored successfully'
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            throw error;
        throw new errorHandler_1.AppError('Failed to restore from backup', 500, 'RESTORE_ERROR');
    }
});
router.delete('/:backupId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { backupId } = req.params;
        const success = await backupService.deleteBackup(backupId);
        if (!success) {
            throw new errorHandler_1.AppError('Backup not found', 404, 'NOT_FOUND');
        }
        res.json({
            success: true,
            message: 'Backup deleted successfully'
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            throw error;
        throw new errorHandler_1.AppError('Failed to delete backup', 500, 'DELETE_ERROR');
    }
});
exports.default = router;
//# sourceMappingURL=backup.js.map