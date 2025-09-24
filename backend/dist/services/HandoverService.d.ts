export interface CreateHandoverDto {
    title: string;
    content: any;
    status?: string;
    priority?: string;
    category?: string;
    tags?: string[];
    authorId: number;
}
export interface UpdateHandoverDto {
    title?: string;
    content?: any;
    status?: string;
    priority?: string;
    category?: string;
    tags?: string[];
}
export interface HandoverFilters {
    page: number;
    limit: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    userId: number;
}
export declare class HandoverService {
    private mongoService;
    private cacheService;
    constructor();
    getAllHandovers(filters: HandoverFilters): Promise<{
        handovers: ({
            author: {
                username: string;
                id: number;
                fullName: string;
                department: string | null;
            };
            _count: {
                shares: number;
                comments: number;
            };
        } & {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            title: string;
            category: string | null;
            status: string;
            authorId: number;
            priority: string;
            tags: string[];
            mongoId: string;
            completedAt: Date | null;
            archivedAt: Date | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    createHandover(data: CreateHandoverDto): Promise<{
        author: {
            username: string;
            id: number;
            fullName: string;
            department: string | null;
        };
    } & {
        createdAt: Date;
        updatedAt: Date;
        id: number;
        title: string;
        category: string | null;
        status: string;
        authorId: number;
        priority: string;
        tags: string[];
        mongoId: string;
        completedAt: Date | null;
        archivedAt: Date | null;
    }>;
    getHandoverById(id: number, userId: number): Promise<any>;
    updateHandover(id: number, data: UpdateHandoverDto, userId: number): Promise<({
        author: {
            username: string;
            id: number;
            fullName: string;
            department: string | null;
        };
    } & {
        createdAt: Date;
        updatedAt: Date;
        id: number;
        title: string;
        category: string | null;
        status: string;
        authorId: number;
        priority: string;
        tags: string[];
        mongoId: string;
        completedAt: Date | null;
        archivedAt: Date | null;
    }) | null>;
    deleteHandover(id: number, userId: number): Promise<boolean>;
    createVersion(documentId: number, changeSummary: string, userId: number): Promise<{
        documentId: number;
        createdAt: Date;
        createdBy: number;
        id: number;
        mongoId: string;
        versionNumber: number;
        changeSummary: string | null;
    }>;
    getVersions(documentId: number, userId: number): Promise<({
        creator: {
            username: string;
            id: number;
            fullName: string;
        };
    } & {
        documentId: number;
        createdAt: Date;
        createdBy: number;
        id: number;
        mongoId: string;
        versionNumber: number;
        changeSummary: string | null;
    })[]>;
    shareHandover(documentId: number, sharedWithUserId: number, permissionLevel: string, sharedBy: number, expiresAt?: Date): Promise<{
        sharedWithUser: {
            username: string;
            id: number;
            fullName: string;
            department: string | null;
        };
    } & {
        documentId: number;
        id: number;
        permissionLevel: string;
        sharedAt: Date;
        expiresAt: Date | null;
        sharedWithUserId: number;
        sharedBy: number;
    }>;
    getShares(documentId: number, userId: number): Promise<({
        sharedWithUser: {
            username: string;
            id: number;
            fullName: string;
            department: string | null;
        };
    } & {
        documentId: number;
        id: number;
        permissionLevel: string;
        sharedAt: Date;
        expiresAt: Date | null;
        sharedWithUserId: number;
        sharedBy: number;
    })[]>;
    deleteShare(documentId: number, shareId: number, userId: number): Promise<boolean>;
    getComments(documentId: number, userId: number): Promise<({
        author: {
            username: string;
            id: number;
            fullName: string;
            department: string | null;
        };
        replies: ({
            author: {
                username: string;
                id: number;
                fullName: string;
                department: string | null;
            };
        } & {
            documentId: number;
            content: string;
            createdAt: Date;
            updatedAt: Date;
            id: number;
            authorId: number;
            parentCommentId: number | null;
            isDeleted: boolean;
        })[];
    } & {
        documentId: number;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        authorId: number;
        parentCommentId: number | null;
        isDeleted: boolean;
    })[]>;
    createComment(documentId: number, content: string, authorId: number, parentCommentId?: number): Promise<{
        author: {
            username: string;
            id: number;
            fullName: string;
            department: string | null;
        };
    } & {
        documentId: number;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        authorId: number;
        parentCommentId: number | null;
        isDeleted: boolean;
    }>;
    updateComment(commentId: number, content: string, userId: number): Promise<({
        author: {
            username: string;
            id: number;
            fullName: string;
            department: string | null;
        };
    } & {
        documentId: number;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        authorId: number;
        parentCommentId: number | null;
        isDeleted: boolean;
    }) | null>;
    deleteComment(commentId: number, userId: number): Promise<boolean>;
}
//# sourceMappingURL=HandoverService.d.ts.map