import mongoose, { Schema, Document, Types } from 'mongoose';
import { logger } from '../utils/logger';

// MongoDB 연결
export async function connectMongoDB(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/didimdol';
    await mongoose.connect(mongoUri);
    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

// 인수인계서 본문 스키마
interface IHandoverContent extends Document {
  documentId: number;
  version: number;
  content: {
    sections: Array<{
      id: string;
      title: string;
      content: string;
      order: number;
      type: string;
    }>;
    attachments: Array<{
      id: string;
      filename: string;
      filepath: string;
      fileSize: number;
      mimeType: string;
      uploadedAt: Date;
    }>;
    metadata: {
      totalSections: number;
      wordCount: number;
      lastModifiedSection: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
  updatedBy: number;
}

const HandoverContentSchema = new Schema<IHandoverContent>({
  documentId: { type: Number, required: true, index: true },
  version: { type: Number, required: true },
  content: {
    sections: { type: Schema.Types.Mixed, required: true },
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

// 인수인계서 템플릿 스키마
interface IHandoverTemplate extends Document {
  name: string;
  description: string;
  category: string;
  templateContent: {
    sections: Array<{
      id: string;
      title: string;
      placeholder: string;
      required: boolean;
      type: string;
    }>;
  };
  createdAt: Date;
  createdBy: number;
  isPublic: boolean;
  usageCount: number;
}

const HandoverTemplateSchema = new Schema<IHandoverTemplate>({
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

// 모델 생성
const HandoverContent = mongoose.model<IHandoverContent>('HandoverContent', HandoverContentSchema);
const HandoverTemplate = mongoose.model<IHandoverTemplate>('HandoverTemplate', HandoverTemplateSchema);

export class MongoService {
  // 인수인계서 본문 생성
  async createContent(data: {
    documentId: number;
    version: number;
    content: any;
    createdBy: number;
    mongoId?: string;
  }): Promise<IHandoverContent> {
    try {
      const handoverContentId = data.mongoId
        ? new Types.ObjectId(data.mongoId)
        : new Types.ObjectId();

      const handoverContent = new HandoverContent({
        _id: handoverContentId,
        documentId: data.documentId,
        version: data.version,
        content: data.content,
        createdBy: data.createdBy,
        updatedBy: data.createdBy
      });

      const saved = await handoverContent.save();
      const savedId = (saved._id as Types.ObjectId).toHexString();
      logger.info(`Created handover content ${savedId} for document ${data.documentId}, version ${data.version}`);
      return saved;
    } catch (error) {
      logger.error('Failed to create handover content:', error);
      throw error;
    }
  }

  // 인수인계서 본문 조회
  async getContent(mongoId: string): Promise<IHandoverContent | null> {
    try {
      const objectId = this.toObjectId(mongoId);
      if (!objectId) {
        logger.warn(`Invalid mongoId provided when fetching content: ${mongoId}`);
        return null;
      }

      const content = await HandoverContent.findById(objectId);
      return content;
    } catch (error) {
      logger.error('Failed to get handover content:', error);
      throw error;
    }
  }

  // 인수인계서 본문 업데이트
  async updateContent(mongoId: string, content: any, updatedBy?: number): Promise<IHandoverContent | null> {
    try {
      const objectId = this.toObjectId(mongoId);
      if (!objectId) {
        logger.warn(`Invalid mongoId provided when updating content: ${mongoId}`);
        return null;
      }

      const updateData: any = {
        content,
        updatedAt: new Date()
      };

      if (updatedBy) {
        updateData.updatedBy = updatedBy;
      }

      const updated = await HandoverContent.findByIdAndUpdate(
        objectId,
        updateData,
        { new: true }
      );

      if (updated) {
        logger.info(`Updated handover content for mongoId ${mongoId}`);
      }

      return updated;
    } catch (error) {
      logger.error('Failed to update handover content:', error);
      throw error;
    }
  }

  // 인수인계서 본문 삭제
  async deleteContent(mongoId: string): Promise<boolean> {
    try {
      const objectId = this.toObjectId(mongoId);
      if (!objectId) {
        logger.warn(`Invalid mongoId provided when deleting content: ${mongoId}`);
        return false;
      }

      const result = await HandoverContent.deleteOne({ _id: objectId });
      if (result.deletedCount) {
        logger.info(`Deleted handover content for mongoId ${mongoId}`);
      }
      return (result.deletedCount ?? 0) > 0;
    } catch (error) {
      logger.error('Failed to delete handover content:', error);
      throw error;
    }
  }

  // 템플릿 생성
  async createTemplate(data: {
    name: string;
    description: string;
    category: string;
    templateContent: any;
    createdBy: number;
    isPublic?: boolean;
  }): Promise<IHandoverTemplate> {
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
      logger.info(`Created handover template: ${data.name}`);
      return saved;
    } catch (error) {
      logger.error('Failed to create handover template:', error);
      throw error;
    }
  }

  // 템플릿 조회
  async getTemplates(filters: {
    category?: string;
    isPublic?: boolean;
    search?: string;
  } = {}): Promise<IHandoverTemplate[]> {
    try {
      const query: any = {};

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
    } catch (error) {
      logger.error('Failed to get handover templates:', error);
      throw error;
    }
  }

  // 템플릿 사용 횟수 증가
  async incrementTemplateUsage(templateId: string): Promise<void> {
    try {
      await HandoverTemplate.findByIdAndUpdate(
        templateId,
        { $inc: { usageCount: 1 } }
      );
    } catch (error) {
      logger.error('Failed to increment template usage:', error);
      throw error;
    }
  }

  // 템플릿 삭제
  async deleteTemplate(templateId: string, userId: number): Promise<boolean> {
    try {
      const result = await HandoverTemplate.deleteOne({
        _id: templateId,
        createdBy: userId
      });

      return result.deletedCount > 0;
    } catch (error) {
      logger.error('Failed to delete handover template:', error);
      throw error;
    }
  }

  private toObjectId(mongoId: string): Types.ObjectId | null {
    if (!mongoId) {
      return null;
    }

    try {
      return new Types.ObjectId(mongoId);
    } catch (error) {
      return null;
    }
  }
}
