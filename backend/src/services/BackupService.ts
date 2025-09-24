import fs from 'fs/promises';
import path from 'path';
import { gzipSync, gunzipSync } from 'zlib';
import { Types } from 'mongoose';

import { prisma } from '../config/database';
import { logger } from '../utils/logger';

interface PostgresSnapshot {
  users: any[];
  handoverDocuments: any[];
  handoverVersions: any[];
  handoverShares: any[];
  handoverComments: any[];
}

interface MongoSnapshot {
  handovercontents: any[];
  handovertemplates: any[];
}

interface BackupSnapshot {
  metadata: {
    backupId: string;
    createdAt: string;
    version: string;
  };
  postgres: PostgresSnapshot;
  mongo: MongoSnapshot;
}

export class BackupService {
  private backupDir: string;

  constructor() {
    const defaultDir = path.resolve(process.cwd(), 'backups');
    this.backupDir = process.env.BACKUP_DIR || defaultDir;
  }

  async createFullBackup(): Promise<string> {
    await fs.mkdir(this.backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup_${timestamp}`;
    const backupFile = path.join(this.backupDir, `${backupId}.json.gz`);

    logger.info(`Starting full backup: ${backupId}`);

    const snapshot = await this.buildSnapshot(backupId);
    const compressed = gzipSync(Buffer.from(JSON.stringify(snapshot, null, 2)));
    await fs.writeFile(backupFile, compressed);

    logger.info(`✅ Full backup completed: ${backupId}`);
    return backupId;
  }

  private async buildSnapshot(backupId: string): Promise<BackupSnapshot> {
    const [postgres, mongo] = await Promise.all([
      this.buildPostgresSnapshot(),
      this.buildMongoSnapshot()
    ]);

    return {
      metadata: {
        backupId,
        createdAt: new Date().toISOString(),
        version: '1.0.0'
      },
      postgres,
      mongo
    };
  }

  private async buildPostgresSnapshot(): Promise<PostgresSnapshot> {
    const [
      users,
      handoverDocuments,
      handoverVersions,
      handoverShares,
      handoverComments
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.handoverDocument.findMany(),
      prisma.handoverVersion.findMany(),
      prisma.handoverShare.findMany(),
      prisma.handoverComment.findMany()
    ]);

    return {
      users,
      handoverDocuments,
      handoverVersions,
      handoverShares,
      handoverComments
    };
  }

  private async buildMongoSnapshot(): Promise<MongoSnapshot> {
    const mongoose = require('mongoose');
    const connection = mongoose.connection;

    if (!connection || connection.readyState !== 1) {
      logger.warn('MongoDB connection is not ready. Skipping Mongo snapshot.');
      return { handovercontents: [], handovertemplates: [] };
    }

    const fetchCollection = async (name: string) => {
      try {
        const docs = await connection.db.collection(name).find({}).toArray();
        return docs.map((doc: any) => serializeForBackup(doc));
      } catch (error) {
        logger.warn(`Failed to snapshot Mongo collection ${name}:`, error);
        return [];
      }
    };

    const [handovercontents, handovertemplates] = await Promise.all([
      fetchCollection('handovercontents'),
      fetchCollection('handovertemplates')
    ]);

    return { handovercontents, handovertemplates };
  }

  async getBackupList(): Promise<any[]> {
    await fs.mkdir(this.backupDir, { recursive: true });

    try {
      const files = await fs.readdir(this.backupDir);
      const backups = [] as any[];

      for (const file of files) {
        if (!file.startsWith('backup_') || !file.endsWith('.json.gz')) continue;
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);

        backups.push({
          id: file.replace('.json.gz', ''),
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        });
      }

      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      logger.error('Failed to get backup list:', error);
      return [];
    }
  }

  async restoreFromBackup(backupId: string): Promise<boolean> {
    const backupFile = path.join(this.backupDir, `${backupId}.json.gz`);

    try {
      await fs.access(backupFile);
    } catch {
      throw new Error(`Backup not found: ${backupId}`);
    }

    logger.info(`Starting restore from backup: ${backupId}`);

    try {
      const compressed = await fs.readFile(backupFile);
      const snapshot = JSON.parse(gunzipSync(compressed).toString()) as BackupSnapshot;

      await this.restorePostgres(snapshot.postgres);
      await this.restoreMongo(snapshot.mongo);

      logger.info(`✅ Restore completed from backup: ${backupId}`);
      return true;
    } catch (error) {
      logger.error('❌ Restore failed:', error);
      throw error;
    }
  }

  private async restorePostgres(data: PostgresSnapshot): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        for (const user of data.users) {
          const { id, ...rest } = user;
          await tx.user.upsert({
            where: { id },
            update: removeKeys(rest, ['createdAt', 'updatedAt']),
            create: user
          });
        }

        for (const document of data.handoverDocuments) {
          const { id, ...rest } = document;
          await tx.handoverDocument.upsert({
            where: { id },
            update: removeKeys(rest, ['createdAt', 'updatedAt']),
            create: document
          });
        }

        for (const version of data.handoverVersions) {
          const { id, ...rest } = version;
          await tx.handoverVersion.upsert({
            where: { id },
            update: removeKeys(rest, ['createdAt']),
            create: version
          });
        }

        for (const share of data.handoverShares) {
          const { id, ...rest } = share;
          await tx.handoverShare.upsert({
            where: { id },
            update: removeKeys(rest, ['sharedAt']),
            create: share
          });
        }

        for (const comment of data.handoverComments) {
          const { id, ...rest } = comment;
          await tx.handoverComment.upsert({
            where: { id },
            update: removeKeys(rest, ['createdAt', 'updatedAt']),
            create: comment
          });
        }
      });

      logger.info('PostgreSQL data restored');
    } catch (error) {
      logger.error('Failed to restore PostgreSQL data:', error);
      throw error;
    }
  }

  private async restoreMongo(data: MongoSnapshot): Promise<void> {
    const mongoose = require('mongoose');
    const connection = mongoose.connection;

    if (!connection || connection.readyState !== 1) {
      logger.warn('MongoDB connection is not ready. Skipping Mongo restore.');
      return;
    }

    const restoreCollection = async (name: string, docs: any[]) => {
      const collection = connection.db.collection(name);
      await collection.deleteMany({});

      if (!docs.length) return;

      const payload = docs.map((doc) => hydrateMongoDocument(doc));
      await collection.insertMany(payload, { ordered: true });
    };

    try {
      await restoreCollection('handovercontents', data.handovercontents || []);
      await restoreCollection('handovertemplates', data.handovertemplates || []);
      logger.info('MongoDB data restored');
    } catch (error) {
      logger.error('Failed to restore MongoDB data:', error);
      throw error;
    }
}

async deleteBackup(backupId: string): Promise<boolean> {
    const backupFile = path.join(this.backupDir, `${backupId}.json.gz`);

    try {
      await fs.unlink(backupFile);
      logger.info(`Backup deleted: ${backupId}`);
      return true;
    } catch (error) {
      logger.error('Failed to delete backup:', error);
      return false;
    }
  }

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

function removeKeys<T extends Record<string, any>>(source: T, keys: string[]): Partial<T> {
  const clone: Record<string, any> = { ...source };
  for (const key of keys) {
    if (key in clone) {
      delete clone[key];
    }
  }
  return clone as Partial<T>;
}

function serializeForBackup(value: any): any {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value && typeof value === 'object') {
    if (typeof value.toHexString === 'function') {
      return value.toHexString();
    }

    if (Array.isArray(value)) {
      return value.map((entry) => serializeForBackup(entry));
    }

    const serialized: Record<string, any> = {};
    for (const [key, nested] of Object.entries(value)) {
      serialized[key] = serializeForBackup(nested);
    }
    return serialized;
  }

  return value;
}

function hydrateMongoDocument(doc: any): any {
  if (!doc || typeof doc !== 'object') {
    return doc;
  }

  const hydrated: Record<string, any> = {};
  for (const [key, value] of Object.entries(doc)) {
    if (key === '_id' && typeof value === 'string') {
      hydrated._id = new Types.ObjectId(value);
      continue;
    }

    if (typeof value === 'string' && key.endsWith('At')) {
      const parsed = new Date(value);
      hydrated[key] = Number.isNaN(parsed.getTime()) ? value : parsed;
      continue;
    }

    if (Array.isArray(value)) {
      hydrated[key] = value.map((item) => hydrateMongoDocument(item));
      continue;
    }

    if (value && typeof value === 'object') {
      hydrated[key] = hydrateMongoDocument(value);
      continue;
    }

    hydrated[key] = value;
  }

  return hydrated;
}
