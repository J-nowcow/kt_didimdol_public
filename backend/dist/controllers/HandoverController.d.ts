import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare class HandoverController {
    private handoverService;
    constructor();
    getAllHandovers: (req: AuthRequest, res: Response) => Promise<void>;
    createHandover: (req: AuthRequest, res: Response) => Promise<void>;
    getHandoverById: (req: AuthRequest, res: Response) => Promise<void>;
    updateHandover: (req: AuthRequest, res: Response) => Promise<void>;
    deleteHandover: (req: AuthRequest, res: Response) => Promise<void>;
    createVersion: (req: AuthRequest, res: Response) => Promise<void>;
    getVersions: (req: AuthRequest, res: Response) => Promise<void>;
    shareHandover: (req: AuthRequest, res: Response) => Promise<void>;
    getShares: (req: AuthRequest, res: Response) => Promise<void>;
    deleteShare: (req: AuthRequest, res: Response) => Promise<void>;
    getComments: (req: AuthRequest, res: Response) => Promise<void>;
    createComment: (req: AuthRequest, res: Response) => Promise<void>;
    updateComment: (req: AuthRequest, res: Response) => Promise<void>;
    deleteComment: (req: AuthRequest, res: Response) => Promise<void>;
}
//# sourceMappingURL=HandoverController.d.ts.map