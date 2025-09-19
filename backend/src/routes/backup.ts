import { Router } from 'express';
import { BackupService } from '../services/BackupService';
import { authenticateToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const backupService = new BackupService();

// 전체 백업 생성
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const backupId = await backupService.createFullBackup();
    
    res.status(201).json({
      success: true,
      data: {
        backupId,
        message: 'Backup created successfully'
      }
    });
  } catch (error) {
    throw new AppError('Failed to create backup', 500, 'BACKUP_ERROR');
  }
});

// 백업 목록 조회
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const backups = await backupService.getBackupList();
    
    res.json({
      success: true,
      data: backups
    });
  } catch (error) {
    throw new AppError('Failed to get backup list', 500, 'FETCH_ERROR');
  }
});

// 백업 상태 조회
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = await backupService.getBackupStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    throw new AppError('Failed to get backup status', 500, 'FETCH_ERROR');
  }
});

// 백업에서 복구
router.post('/restore/:backupId', authenticateToken, async (req, res) => {
  try {
    const { backupId } = req.params;
    const success = await backupService.restoreFromBackup(backupId);
    
    if (!success) {
      throw new AppError('Restore failed', 500, 'RESTORE_ERROR');
    }
    
    res.json({
      success: true,
      message: 'Data restored successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to restore from backup', 500, 'RESTORE_ERROR');
  }
});

// 백업 삭제
router.delete('/:backupId', authenticateToken, async (req, res) => {
  try {
    const { backupId } = req.params;
    const success = await backupService.deleteBackup(backupId);
    
    if (!success) {
      throw new AppError('Backup not found', 404, 'NOT_FOUND');
    }
    
    res.json({
      success: true,
      message: 'Backup deleted successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete backup', 500, 'DELETE_ERROR');
  }
});

export default router;
