"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const zlib_1 = require("zlib");
const mongoose_1 = require("mongoose");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
class BackupService {
    backupDir;
    constructor() {
        const defaultDir = path_1.default.resolve(process.cwd(), 'backups');
        this.backupDir = process.env.BACKUP_DIR || defaultDir;
    }
    async createFullBackup() {
        await promises_1.default.mkdir(this.backupDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupId = `backup_${timestamp}`;
        const backupFile = path_1.default.join(this.backupDir, `${backupId}.json.gz`);
        logger_1.logger.info(`Starting full backup: ${backupId}`);
        const snapshot = await this.buildSnapshot(backupId);
        const compressed = (0, zlib_1.gzipSync)(Buffer.from(JSON.stringify(snapshot, null, 2)));
        await promises_1.default.writeFile(backupFile, compressed);
        logger_1.logger.info(`✅ Full backup completed: ${backupId}`);
        return backupId;
    }
    async buildSnapshot(backupId) {
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
    async buildPostgresSnapshot() {
        const [users, handoverDocuments, handoverVersions, handoverShares, handoverComments] = await Promise.all([
            database_1.prisma.user.findMany(),
            database_1.prisma.handoverDocument.findMany(),
            database_1.prisma.handoverVersion.findMany(),
            database_1.prisma.handoverShare.findMany(),
            database_1.prisma.handoverComment.findMany()
        ]);
        return {
            users,
            handoverDocuments,
            handoverVersions,
            handoverShares,
            handoverComments
        };
    }
    async buildMongoSnapshot() {
        const mongoose = require('mongoose');
        const connection = mongoose.connection;
        if (!connection || connection.readyState !== 1) {
            logger_1.logger.warn('MongoDB connection is not ready. Skipping Mongo snapshot.');
            return { handovercontents: [], handovertemplates: [] };
        }
        const fetchCollection = async (name) => {
            try {
                const docs = await connection.db.collection(name).find({}).toArray();
                return docs.map((doc) => serializeForBackup(doc));
            }
            catch (error) {
                logger_1.logger.warn(`Failed to snapshot Mongo collection ${name}:`, error);
                return [];
            }
        };
        const [handovercontents, handovertemplates] = await Promise.all([
            fetchCollection('handovercontents'),
            fetchCollection('handovertemplates')
        ]);
        return { handovercontents, handovertemplates };
    }
    async getBackupList() {
        await promises_1.default.mkdir(this.backupDir, { recursive: true });
        try {
            const files = await promises_1.default.readdir(this.backupDir);
            const backups = [];
            for (const file of files) {
                if (!file.startsWith('backup_') || !file.endsWith('.json.gz'))
                    continue;
                const filePath = path_1.default.join(this.backupDir, file);
                const stats = await promises_1.default.stat(filePath);
                backups.push({
                    id: file.replace('.json.gz', ''),
                    filename: file,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime
                });
            }
            return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        catch (error) {
            logger_1.logger.error('Failed to get backup list:', error);
            return [];
        }
    }
    async restoreFromBackup(backupId) {
        const backupFile = path_1.default.join(this.backupDir, `${backupId}.json.gz`);
        try {
            await promises_1.default.access(backupFile);
        }
        catch {
            throw new Error(`Backup not found: ${backupId}`);
        }
        logger_1.logger.info(`Starting restore from backup: ${backupId}`);
        try {
            const compressed = await promises_1.default.readFile(backupFile);
            const snapshot = JSON.parse((0, zlib_1.gunzipSync)(compressed).toString());
            await this.restorePostgres(snapshot.postgres);
            await this.restoreMongo(snapshot.mongo);
            logger_1.logger.info(`✅ Restore completed from backup: ${backupId}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error('❌ Restore failed:', error);
            throw error;
        }
    }
    async restorePostgres(data) {
        try {
            await database_1.prisma.$transaction(async (tx) => {
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
            logger_1.logger.info('PostgreSQL data restored');
        }
        catch (error) {
            logger_1.logger.error('Failed to restore PostgreSQL data:', error);
            throw error;
        }
    }
    async restoreMongo(data) {
        const mongoose = require('mongoose');
        const connection = mongoose.connection;
        if (!connection || connection.readyState !== 1) {
            logger_1.logger.warn('MongoDB connection is not ready. Skipping Mongo restore.');
            return;
        }
        const restoreCollection = async (name, docs) => {
            const collection = connection.db.collection(name);
            await collection.deleteMany({});
            if (!docs.length)
                return;
            const payload = docs.map((doc) => hydrateMongoDocument(doc));
            await collection.insertMany(payload, { ordered: true });
        };
        try {
            await restoreCollection('handovercontents', data.handovercontents || []);
            await restoreCollection('handovertemplates', data.handovertemplates || []);
            logger_1.logger.info('MongoDB data restored');
        }
        catch (error) {
            logger_1.logger.error('Failed to restore MongoDB data:', error);
            throw error;
        }
    }
    async deleteBackup(backupId) {
        const backupFile = path_1.default.join(this.backupDir, `${backupId}.json.gz`);
        try {
            await promises_1.default.unlink(backupFile);
            logger_1.logger.info(`Backup deleted: ${backupId}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to delete backup:', error);
            return false;
        }
    }
    async getBackupStatus() {
        try {
            const backups = await this.getBackupList();
            const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
            return {
                totalBackups: backups.length,
                totalSize,
                lastBackup: backups[0]?.createdAt || null,
                backupDir: this.backupDir
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get backup status:', error);
            return {
                totalBackups: 0,
                totalSize: 0,
                lastBackup: null,
                backupDir: this.backupDir
            };
        }
    }
}
exports.BackupService = BackupService;
function removeKeys(source, keys) {
    const clone = { ...source };
    for (const key of keys) {
        if (key in clone) {
            delete clone[key];
        }
    }
    return clone;
}
function serializeForBackup(value) {
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
        const serialized = {};
        for (const [key, nested] of Object.entries(value)) {
            serialized[key] = serializeForBackup(nested);
        }
        return serialized;
    }
    return value;
}
function hydrateMongoDocument(doc) {
    if (!doc || typeof doc !== 'object') {
        return doc;
    }
    const hydrated = {};
    for (const [key, value] of Object.entries(doc)) {
        if (key === '_id' && typeof value === 'string') {
            hydrated._id = new mongoose_1.Types.ObjectId(value);
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
//# sourceMappingURL=BackupService.js.map