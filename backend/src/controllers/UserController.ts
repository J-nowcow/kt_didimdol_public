import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { requireUserId } from '../utils/auth';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // Get all users
  public getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 10, search, department } = req.query;
      
      const users = await this.userService.getAllUsers({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        department: department as string
      });

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      throw new AppError('Failed to fetch users', 500, 'FETCH_ERROR');
    }
  };

  // Get user by ID
  public getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const user = await this.userService.getUserById(parseInt(id));

      if (!user) {
        throw new AppError('User not found', 404, 'NOT_FOUND');
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch user', 500, 'FETCH_ERROR');
    }
  };

  // Update user
  public updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const user = await this.userService.updateUser(parseInt(id), req.body, requireUserId(req));

      if (!user) {
        throw new AppError('User not found', 404, 'NOT_FOUND');
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update user', 500, 'UPDATE_ERROR');
    }
  };

  // Get user's handovers
  public getUserHandovers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const { page = 1, limit = 10, status } = req.query as { page?: string | number; limit?: string | number; status?: string };
      
      const handovers = await this.userService.getUserHandovers(parseInt(id), {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string
      });

      res.json({
        success: true,
        data: handovers
      });
    } catch (error) {
      throw new AppError('Failed to fetch user handovers', 500, 'FETCH_ERROR');
    }
  };
}
