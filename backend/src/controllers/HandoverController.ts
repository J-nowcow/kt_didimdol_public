import { Request, Response } from 'express';
import { HandoverService } from '../services/HandoverService';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { requireUserId } from '../utils/auth';

export class HandoverController {
  private handoverService: HandoverService;

  constructor() {
    this.handoverService = new HandoverService();
  }

  // Get all handovers
  public getAllHandovers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      const handovers = await this.handoverService.getAllHandovers({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as string,
        userId: process.env.NODE_ENV === 'development' ? 1 : requireUserId(req)
      });

      res.json({
        success: true,
        data: handovers
      });
    } catch (error) {
      throw new AppError('Failed to fetch handovers', 500, 'FETCH_ERROR');
    }
  };

  // Create new handover
  public createHandover = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // 개발 환경에서도 실제 데이터베이스에 저장

      const handoverData = {
        ...req.body,
        authorId: process.env.NODE_ENV === 'development' ? 1 : requireUserId(req)
      };

      const handover = await this.handoverService.createHandover(handoverData);

      res.status(201).json({
        success: true,
        data: handover
      });
    } catch (error) {
      console.error('Create handover error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new AppError(`Failed to create handover: ${errorMessage}`, 500, 'CREATE_ERROR');
    }
  };

  // Get handover by ID
  public getHandoverById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      
      const userId = requireUserId(req);
      const handover = await this.handoverService.getHandoverById(parseInt(id), userId);

      if (!handover) {
        throw new AppError('Handover not found', 404, 'NOT_FOUND');
      }

      res.json({
        success: true,
        data: handover
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch handover', 500, 'FETCH_ERROR');
    }
  };

  // Update handover
  public updateHandover = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      
      const userId = requireUserId(req);
      const handover = await this.handoverService.updateHandover(parseInt(id), req.body, userId);

      if (!handover) {
        throw new AppError('Handover not found', 404, 'NOT_FOUND');
      }

      res.json({
        success: true,
        data: handover
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update handover', 500, 'UPDATE_ERROR');
    }
  };

  // Delete handover
  public deleteHandover = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const success = await this.handoverService.deleteHandover(parseInt(id), requireUserId(req));

      if (!success) {
        throw new AppError('Handover not found', 404, 'NOT_FOUND');
      }

      res.json({
        success: true,
        message: 'Handover deleted successfully'
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete handover', 500, 'DELETE_ERROR');
    }
  };

  // Create version
  public createVersion = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const { changeSummary } = req.body as { changeSummary?: string };
      
      const version = await this.handoverService.createVersion(parseInt(id), (changeSummary as string), requireUserId(req));

      res.status(201).json({
        success: true,
        data: version
      });
    } catch (error) {
      throw new AppError('Failed to create version', 500, 'CREATE_ERROR');
    }
  };

  // Get versions
  public getVersions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const versions = await this.handoverService.getVersions(parseInt(id), requireUserId(req));

      res.json({
        success: true,
        data: versions
      });
    } catch (error) {
      throw new AppError('Failed to fetch versions', 500, 'FETCH_ERROR');
    }
  };

  // Share handover
  public shareHandover = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const { sharedWithUserId, permissionLevel, expiresAt } = req.body as { sharedWithUserId: number; permissionLevel: string; expiresAt?: string };
      
      const share = await this.handoverService.shareHandover(
        parseInt(id),
        Number(sharedWithUserId),
        String(permissionLevel),
        requireUserId(req),
        expiresAt ? new Date(expiresAt) : undefined
      );

      res.status(201).json({
        success: true,
        data: share
      });
    } catch (error) {
      throw new AppError('Failed to share handover', 500, 'SHARE_ERROR');
    }
  };

  // Get shares
  public getShares = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const shares = await this.handoverService.getShares(parseInt(id), requireUserId(req));

      res.json({
        success: true,
        data: shares
      });
    } catch (error) {
      throw new AppError('Failed to fetch shares', 500, 'FETCH_ERROR');
    }
  };

  // Delete share
  public deleteShare = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id, shareId } = req.params as { id: string; shareId: string };
      const success = await this.handoverService.deleteShare(parseInt(id), parseInt(shareId), requireUserId(req));

      if (!success) {
        throw new AppError('Share not found', 404, 'NOT_FOUND');
      }

      res.json({
        success: true,
        message: 'Share deleted successfully'
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete share', 500, 'DELETE_ERROR');
    }
  };

  // Get comments
  public getComments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const comments = await this.handoverService.getComments(parseInt(id), requireUserId(req));

      res.json({
        success: true,
        data: comments
      });
    } catch (error) {
      throw new AppError('Failed to fetch comments', 500, 'FETCH_ERROR');
    }
  };

  // Create comment
  public createComment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const { content, parentCommentId } = req.body as { content?: string; parentCommentId?: number };
      
      const comment = await this.handoverService.createComment(
        parseInt(id),
        String(content as string),
        requireUserId(req),
        typeof parentCommentId === 'number' ? parentCommentId : undefined
      );

      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      throw new AppError('Failed to create comment', 500, 'CREATE_ERROR');
    }
  };

  // Update comment
  public updateComment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { commentId } = req.params as { commentId: string };
      const { content } = req.body as { content?: string };
      
      const comment = await this.handoverService.updateComment(parseInt(commentId), String(content as string), requireUserId(req));

      if (!comment) {
        throw new AppError('Comment not found', 404, 'NOT_FOUND');
      }

      res.json({
        success: true,
        data: comment
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update comment', 500, 'UPDATE_ERROR');
    }
  };

  // Delete comment
  public deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { commentId } = req.params as { commentId: string };
      const success = await this.handoverService.deleteComment(parseInt(commentId), requireUserId(req));

      if (!success) {
        throw new AppError('Comment not found', 404, 'NOT_FOUND');
      }

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete comment', 500, 'DELETE_ERROR');
    }
  };
}
