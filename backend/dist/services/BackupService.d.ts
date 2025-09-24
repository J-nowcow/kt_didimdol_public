export declare class BackupService {
    private backupDir;
    constructor();
    createFullBackup(): Promise<string>;
    private buildSnapshot;
    private buildPostgresSnapshot;
    private buildMongoSnapshot;
    getBackupList(): Promise<any[]>;
    restoreFromBackup(backupId: string): Promise<boolean>;
    private restorePostgres;
    private restoreMongo;
    deleteBackup(backupId: string): Promise<boolean>;
    getBackupStatus(): Promise<any>;
}
//# sourceMappingURL=BackupService.d.ts.map