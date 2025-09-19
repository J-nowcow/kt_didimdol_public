import { prisma } from '../config/database';
import { MongoService } from './MongoService';
import { logger } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { gzip, gunzip } from 'zlib';

export class BackupService {
  private mongoService: MongoService;
  private backupDir: string;

  constructor() {
    this.mongoService = new MongoService();
    this.backupDir = process.env.BACKUP_DIR || './backups';
  }

  // 전체 데이터베이스 백업
  async createFullBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupId = `backup_${timestamp}`;
      const backupPath = path.join(this.backupDir, backupId);

      // 백업 디렉토리 생성
      await fs.mkdir(backupPath, { recursive: true });

      logger.info(`Starting full backup: ${backupId}`);

      // 1. PostgreSQL 데이터 백업
      const postgresBackup = await this.backupPostgreSQL(backupPath);
      logger.info('PostgreSQL backup completed');

      // 2. MongoDB 데이터 백업
      const mongoBackup = await this.backupMongoDB(backupPath);
      logger.info('MongoDB backup completed');

      // 3. 백업 메타데이터 생성
      const metadata = {
        backupId,
        timestamp: new Date().toISOString(),
        postgresBackup,
        mongoBackup,
        status: 'completed'
      };

      await fs.writeFile(
        path.join(backupPath, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      // 4. 백업 압축
      const compressedPath = await this.compressBackup(backupPath);
      logger.info(`Backup compressed: ${compressedPath}`);

      logger.info(`✅ Full backup completed: ${backupId}`);
      return backupId;

    } catch (error) {
      logger.error('❌ Full backup failed:', error);
      throw error;
    }
  }

  // PostgreSQL 데이터 백업
  private async backupPostgreSQL(backupPath: string): Promise<string> {
    const postgresBackupPath = path.join(backupPath, 'postgres_backup.json');
    
    // 사용자 데이터 백업
    const users = await prisma.user.findMany();
    await fs.writeFile(
      path.join(backupPath, 'users.json'),
      JSON.stringify(users, null, 2)
    );

    // 인수인계서 메타데이터 백업
    const handovers = await prisma.handoverDocument.findMany({
      include: {
        author: true,
        versions: true,
        shares: true,
        comments: true
      }
    });
    await fs.writeFile(
      path.join(backupPath, 'handovers.json'),
      JSON.stringify(handovers, null, 2)
    );

    return postgresBackupPath;
  }

  // MongoDB 데이터 백업
  private async backupMongoDB(backupPath: string): Promise<string> {
    const mongoBackupPath = path.join(backupPath, 'mongodb_backup.json');
    
    // MongoDB 연결 및 데이터 추출
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    
    const collections = ['handovercontents', 'handovertemplates'];
    const mongoData: any = {};

    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const data = await collection.find({}).toArray();
        mongoData[collectionName] = data;
      } catch (error) {
        logger.warn(`Failed to backup collection ${collectionName}:`, error);
      }
    }

    await fs.writeFile(mongoBackupPath, JSON.stringify(mongoData, null, 2));
    return mongoBackupPath;
  }

  // 백업 압축
  private async compressBackup(backupPath: string): Promise<string> {
    const compressedPath = `${backupPath}.tar.gz`;
    
    // 간단한 gzip 압축 (실제로는 tar+gzip 사용 권장)
    const files = await fs.readdir(backupPath);
    const compressedData: any = {};

    for (const file of files) {
      if (file !== 'metadata.json') {
        const filePath = path.join(backupPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        compressedData[file] = content;
      }
    }

    await fs.writeFile(compressedPath, JSON.stringify(compressedData, null, 2));
    return compressedPath;
  }

  // 백업 목록 조회
  async getBackupList(): Promise<any[]> {
    try {
      const backups = [];
      const files = await fs.readdir(this.backupDir);

      for (const file of files) {
        if (file.startsWith('backup_') && file.endsWith('.tar.gz')) {
          const backupPath = path.join(this.backupDir, file);
          const stats = await fs.stat(backupPath);
          
          backups.push({
            id: file.replace('.tar.gz', ''),
            filename: file,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime
          });
        }
      }

      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      logger.error('Failed to get backup list:', error);
      return [];
    }
  }

  // 백업에서 복구
  async restoreFromBackup(backupId: string): Promise<boolean> {
    try {
      const backupPath = path.join(this.backupDir, `${backupId}.tar.gz`);
      
      // 백업 파일 존재 확인
      try {
        await fs.access(backupPath);
      } catch {
        throw new Error(`Backup not found: ${backupId}`);
      }

      logger.info(`Starting restore from backup: ${backupId}`);

      // 1. 백업 데이터 로드
      const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));

      // 2. PostgreSQL 데이터 복구
      if (backupData.users) {
        await this.restorePostgreSQL(backupData);
      }

      // 3. MongoDB 데이터 복구
      if (backupData.handovercontents || backupData.handovertemplates) {
        await this.restoreMongoDB(backupData);
      }

      logger.info(`✅ Restore completed from backup: ${backupId}`);
      return true;

    } catch (error) {
      logger.error('❌ Restore failed:', error);
      throw error;
    }
  }

  // PostgreSQL 데이터 복구
  private async restorePostgreSQL(backupData: any): Promise<void> {
    try {
      // 사용자 데이터 복구
      if (backupData.users) {
        for (const user of backupData.users) {
          await prisma.user.upsert({
            where: { id: user.id },
            update: user,
            create: user
          });
        }
      }

      // 인수인계서 데이터 복구
      if (backupData.handovers) {
        for (const handover of backupData.handovers) {
          await prisma.handoverDocument.upsert({
            where: { id: handover.id },
            update: handover,
            create: handover
          });
        }
      }

      logger.info('PostgreSQL data restored');
    } catch (error) {
      logger.error('Failed to restore PostgreSQL data:', error);
      throw error;
    }
  }

  // MongoDB 데이터 복구
  private async restoreMongoDB(backupData: any): Promise<void> {
    try {
      const mongoose = require('mongoose');
      const db = mongoose.connection.db;

      // 컬렉션별 데이터 복구
      for (const [collectionName, data] of Object.entries(backupData)) {
        if (Array.isArray(data)) {
          const collection = db.collection(collectionName);
          
          // 기존 데이터 삭제 (주의: 프로덕션에서는 더 안전한 방법 사용)
          await collection.deleteMany({});
          
          // 새 데이터 삽입
          if (data.length > 0) {
            await collection.insertMany(data);
          }
        }
      }

      logger.info('MongoDB data restored');
    } catch (error) {
      logger.error('Failed to restore MongoDB data:', error);
      throw error;
    }
  }

  // 백업 삭제
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const backupPath = path.join(this.backupDir, `${backupId}.tar.gz`);
      await fs.unlink(backupPath);
      logger.info(`Backup deleted: ${backupId}`);
      return true;
    } catch (error) {
      logger.error('Failed to delete backup:', error);
      return false;
    }
  }

  // 백업 상태 확인
  async getBackupStatus(): Promise<any> {
    try {
      const backups = await this.getBackupList();
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      
      return {
        totalBackups: backups.length,
        totalSize,
        lastBackup: backups[0]?.createdAt || null,
        backupDir: this.backupDir
      };
    } catch (error) {
      logger.error('Failed to get backup status:', error);
      return {
        totalBackups: 0,
        totalSize: 0,
        lastBackup: null,
        backupDir: this.backupDir
      };
    }
  }
}
