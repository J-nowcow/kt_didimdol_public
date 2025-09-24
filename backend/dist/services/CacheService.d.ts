export declare class CacheService {
    get(key: string): Promise<any>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    invalidateHandover(handoverId: number): Promise<void>;
    invalidateUser(userId: number): Promise<void>;
    invalidateUserHandovers(userId: number): Promise<void>;
    cachePopularHandovers(handovers: any[]): Promise<void>;
    getPopularHandovers(): Promise<any[]>;
    cacheUserHandovers(userId: number, handovers: any[]): Promise<void>;
    getUserHandovers(userId: number): Promise<any[]>;
    clearAll(): Promise<void>;
    deleteByPattern(pattern: string): Promise<void>;
}
//# sourceMappingURL=CacheService.d.ts.map