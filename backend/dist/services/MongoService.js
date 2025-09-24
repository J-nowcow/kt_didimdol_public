"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoService = void 0;
exports.connectMongoDB = connectMongoDB;
const mongoose_1 = __importStar(require("mongoose"));
const logger_1 = require("../utils/logger");
async function connectMongoDB() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/didimdol';
        await mongoose_1.default.connect(mongoUri);
        logger_1.logger.info('✅ MongoDB connected successfully');
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to connect to MongoDB:', error);
        throw error;
    }
}
const HandoverContentSchema = new mongoose_1.Schema({
    documentId: { type: Number, required: true, index: true },
    version: { type: Number, required: true },
    content: {
        sections: [{
                id: String,
                title: String,
                content: String,
                order: Number,
                type: String
            }],
        attachments: [{
                id: String,
                filename: String,
                filepath: String,
                fileSize: Number,
                mimeType: String,
                uploadedAt: Date
            }],
        metadata: {
            totalSections: Number,
            wordCount: Number,
            lastModifiedSection: String
        }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: Number,
    updatedBy: Number
});
const HandoverTemplateSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: String,
    category: String,
    templateContent: {
        sections: [{
                id: String,
                title: String,
                placeholder: String,
                required: Boolean,
                type: String
            }]
    },
    createdAt: { type: Date, default: Date.now },
    createdBy: Number,
    isPublic: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 }
});
const HandoverContent = mongoose_1.default.model('HandoverContent', HandoverContentSchema);
const HandoverTemplate = mongoose_1.default.model('HandoverTemplate', HandoverTemplateSchema);
class MongoService {
    async createContent(data) {
        try {
            const handoverContentId = data.mongoId
                ? new mongoose_1.Types.ObjectId(data.mongoId)
                : new mongoose_1.Types.ObjectId();
            const handoverContent = new HandoverContent({
                _id: handoverContentId,
                documentId: data.documentId,
                version: data.version,
                content: data.content,
                createdBy: data.createdBy,
                updatedBy: data.createdBy
            });
            const saved = await handoverContent.save();
            const savedId = saved._id.toHexString();
            logger_1.logger.info(`Created handover content ${savedId} for document ${data.documentId}, version ${data.version}`);
            return saved;
        }
        catch (error) {
            logger_1.logger.error('Failed to create handover content:', error);
            throw error;
        }
    }
    async getContent(mongoId) {
        try {
            const objectId = this.toObjectId(mongoId);
            if (!objectId) {
                logger_1.logger.warn(`Invalid mongoId provided when fetching content: ${mongoId}`);
                return null;
            }
            const content = await HandoverContent.findById(objectId);
            return content;
        }
        catch (error) {
            logger_1.logger.error('Failed to get handover content:', error);
            throw error;
        }
    }
    async updateContent(mongoId, content, updatedBy) {
        try {
            const objectId = this.toObjectId(mongoId);
            if (!objectId) {
                logger_1.logger.warn(`Invalid mongoId provided when updating content: ${mongoId}`);
                return null;
            }
            const updateData = {
                content,
                updatedAt: new Date()
            };
            if (updatedBy) {
                updateData.updatedBy = updatedBy;
            }
            const updated = await HandoverContent.findByIdAndUpdate(objectId, updateData, { new: true });
            if (updated) {
                logger_1.logger.info(`Updated handover content for mongoId ${mongoId}`);
            }
            return updated;
        }
        catch (error) {
            logger_1.logger.error('Failed to update handover content:', error);
            throw error;
        }
    }
    async deleteContent(mongoId) {
        try {
            const objectId = this.toObjectId(mongoId);
            if (!objectId) {
                logger_1.logger.warn(`Invalid mongoId provided when deleting content: ${mongoId}`);
                return false;
            }
            const result = await HandoverContent.deleteOne({ _id: objectId });
            if (result.deletedCount) {
                logger_1.logger.info(`Deleted handover content for mongoId ${mongoId}`);
            }
            return (result.deletedCount ?? 0) > 0;
        }
        catch (error) {
            logger_1.logger.error('Failed to delete handover content:', error);
            throw error;
        }
    }
    async createTemplate(data) {
        try {
            const template = new HandoverTemplate({
                name: data.name,
                description: data.description,
                category: data.category,
                templateContent: data.templateContent,
                createdBy: data.createdBy,
                isPublic: data.isPublic ?? true
            });
            const saved = await template.save();
            logger_1.logger.info(`Created handover template: ${data.name}`);
            return saved;
        }
        catch (error) {
            logger_1.logger.error('Failed to create handover template:', error);
            throw error;
        }
    }
    async getTemplates(filters = {}) {
        try {
            const query = {};
            if (filters.category) {
                query.category = filters.category;
            }
            if (filters.isPublic !== undefined) {
                query.isPublic = filters.isPublic;
            }
            if (filters.search) {
                query.$or = [
                    { name: { $regex: filters.search, $options: 'i' } },
                    { description: { $regex: filters.search, $options: 'i' } }
                ];
            }
            const templates = await HandoverTemplate.find(query)
                .sort({ usageCount: -1, createdAt: -1 })
                .limit(50);
            return templates;
        }
        catch (error) {
            logger_1.logger.error('Failed to get handover templates:', error);
            throw error;
        }
    }
    async incrementTemplateUsage(templateId) {
        try {
            await HandoverTemplate.findByIdAndUpdate(templateId, { $inc: { usageCount: 1 } });
        }
        catch (error) {
            logger_1.logger.error('Failed to increment template usage:', error);
            throw error;
        }
    }
    async deleteTemplate(templateId, userId) {
        try {
            const result = await HandoverTemplate.deleteOne({
                _id: templateId,
                createdBy: userId
            });
            return result.deletedCount > 0;
        }
        catch (error) {
            logger_1.logger.error('Failed to delete handover template:', error);
            throw error;
        }
    }
    toObjectId(mongoId) {
        if (!mongoId) {
            return null;
        }
        try {
            return new mongoose_1.Types.ObjectId(mongoId);
        }
        catch (error) {
            return null;
        }
    }
}
exports.MongoService = MongoService;
//# sourceMappingURL=MongoService.js.map