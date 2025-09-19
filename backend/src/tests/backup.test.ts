import { BackupService } from '../services/BackupService';
import fs from 'fs/promises';
import path from 'path';

// Mock fs module
jest.mock('fs/promises');
jest.mock('fs');
jest.mock('stream/promises');

describe('BackupService', () => {
  let backupService: BackupService;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(() => {
    backupService = new BackupService();
    mockFs = fs as jest.Mocked<typeof fs>;
  });

  describe('createFullBackup', () => {
    it('should create a full backup successfully', async () => {
      // Mock file system operations
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue(['users.json', 'handovers.json', 'metadata.json']);

      const backupId = await backupService.createFullBackup();

      expect(backupId).toMatch(/^backup_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/);
      expect(mockFs.mkdir).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should handle backup creation errors', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      await expect(backupService.createFullBackup()).rejects.toThrow('Permission denied');
    });
  });

  describe('getBackupList', () => {
    it('should return list of backups', async () => {
      const mockFiles = [
        'backup_2024-01-01T00-00-00-000Z.tar.gz',
        'backup_2024-01-02T00-00-00-000Z.tar.gz'
      ];

      mockFs.readdir.mockResolvedValue(mockFiles);
      mockFs.stat.mockResolvedValue({
        size: 1024,
        birthtime: new Date('2024-01-01'),
        mtime: new Date('2024-01-01')
      } as any);

      const backups = await backupService.getBackupList();

      expect(backups).toHaveLength(2);
      expect(backups[0].id).toBe('backup_2024-01-01T00-00-00-000Z');
      expect(backups[0].size).toBe(1024);
    });

    it('should return empty array when no backups exist', async () => {
      mockFs.readdir.mockResolvedValue([]);

      const backups = await backupService.getBackupList();

      expect(backups).toHaveLength(0);
    });
  });

  describe('getBackupStatus', () => {
    it('should return backup status', async () => {
      const mockBackups = [
        { id: 'backup1', size: 1024, createdAt: new Date('2024-01-01') },
        { id: 'backup2', size: 2048, createdAt: new Date('2024-01-02') }
      ];

      jest.spyOn(backupService, 'getBackupList').mockResolvedValue(mockBackups);

      const status = await backupService.getBackupStatus();

      expect(status.totalBackups).toBe(2);
      expect(status.totalSize).toBe(3072);
      expect(status.lastBackup).toEqual(new Date('2024-01-02'));
    });
  });

  describe('deleteBackup', () => {
    it('should delete backup successfully', async () => {
      mockFs.unlink.mockResolvedValue(undefined);

      const result = await backupService.deleteBackup('backup_123');

      expect(result).toBe(true);
      expect(mockFs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('backup_123.tar.gz')
      );
    });

    it('should handle deletion errors', async () => {
      mockFs.unlink.mockRejectedValue(new Error('File not found'));

      const result = await backupService.deleteBackup('backup_123');

      expect(result).toBe(false);
    });
  });
});
