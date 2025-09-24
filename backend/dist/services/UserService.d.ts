export interface UserFilters {
    page: number;
    limit: number;
    search?: string;
    department?: string;
}
export interface HandoverFilters {
    page: number;
    limit: number;
    status?: string;
}
export declare class UserService {
    private cacheService;
    constructor();
    getAllUsers(filters: UserFilters): Promise<{
        users: {
            username: string;
            createdAt: Date;
            id: number;
            _count: {
                handovers: number;
            };
            email: string;
            fullName: string;
            department: string | null;
            position: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getUserById(id: number): Promise<any>;
    updateUser(id: number, data: any, userId: number): Promise<{
        username: string;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        email: string;
        fullName: string;
        department: string | null;
        position: string | null;
        isActive: boolean;
    }>;
    getUserHandovers(userId: number, filters: HandoverFilters): Promise<{
        handovers: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            title: string;
            category: string | null;
            status: string;
            priority: string;
            tags: string[];
            completedAt: Date | null;
            _count: {
                shares: number;
                comments: number;
            };
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
}
//# sourceMappingURL=UserService.d.ts.map