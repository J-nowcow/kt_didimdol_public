import { Document } from 'mongoose';
export declare function connectMongoDB(): Promise<void>;
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
export declare class MongoService {
    createContent(data: {
        documentId: number;
        version: number;
        content: any;
        createdBy: number;
        mongoId?: string;
    }): Promise<IHandoverContent>;
    getContent(mongoId: string): Promise<IHandoverContent | null>;
    updateContent(mongoId: string, content: any, updatedBy?: number): Promise<IHandoverContent | null>;
    deleteContent(mongoId: string): Promise<boolean>;
    createTemplate(data: {
        name: string;
        description: string;
        category: string;
        templateContent: any;
        createdBy: number;
        isPublic?: boolean;
    }): Promise<IHandoverTemplate>;
    getTemplates(filters?: {
        category?: string;
        isPublic?: boolean;
        search?: string;
    }): Promise<IHandoverTemplate[]>;
    incrementTemplateUsage(templateId: string): Promise<void>;
    deleteTemplate(templateId: string, userId: number): Promise<boolean>;
    private toObjectId;
}
export {};
//# sourceMappingURL=MongoService.d.ts.map