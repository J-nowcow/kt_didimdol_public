import { PrismaClient } from '@prisma/client';
export declare const prisma: PrismaClient<{
    log: ({
        level: "query";
        emit: "event";
    } | {
        level: "error";
        emit: "stdout";
    } | {
        level: "info";
        emit: "stdout";
    } | {
        level: "warn";
        emit: "stdout";
    })[];
}, "query", import("@prisma/client/runtime/library").DefaultArgs>;
export declare function connectDatabase(): Promise<void>;
export declare function disconnectDatabase(): Promise<void>;
//# sourceMappingURL=database.d.ts.map