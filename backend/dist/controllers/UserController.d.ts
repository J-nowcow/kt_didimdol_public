import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare class UserController {
    private userService;
    constructor();
    getAllUsers: (req: AuthRequest, res: Response) => Promise<void>;
    getUserById: (req: AuthRequest, res: Response) => Promise<void>;
    updateUser: (req: AuthRequest, res: Response) => Promise<void>;
    getUserHandovers: (req: AuthRequest, res: Response) => Promise<void>;
}
//# sourceMappingURL=UserController.d.ts.map