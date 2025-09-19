import { Request, Response } from 'express';
import { HandoverService } from '../services/HandoverService';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

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
        userId: req.user!.id
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
      const handoverData = {
        ...req.body,
        authorId: req.user!.id
      };

      const handover = await this.handoverService.createHandover(handoverData);

      res.status(201).json({
        success: true,
        data: handover
      });
    } catch (error) {
      throw new AppError('Failed to create handover', 500, 'CREATE_ERROR');
    }
  };

  // Get handover by ID
  public getHandoverById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const handover = await this.handoverService.getHandoverById(parseInt(id), req.user!.id);

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
      const { id } = req.params;
      const handover = await this.handoverService.updateHandover(parseInt(id), req.body, req.user!.id);

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
      const { id } = req.params;
      const success = await this.handoverService.deleteHandover(parseInt(id), req.user!.id);

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
      const { id } = req.params;
      const { changeSummary } = req.body;
      
      const version = await this.handoverService.createVersion(parseInt(id), changeSummary, req.user!.id);

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
      const { id } = req.params;
      const versions = await this.handoverService.getVersions(parseInt(id), req.user!.id);

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
      const { id } = req.params;
      const { sharedWithUserId, permissionLevel, expiresAt } = req.body;
      
      const share = await this.handoverService.shareHandover(
        parseInt(id),
        sharedWithUserId,
        permissionLevel,
        req.user!.id,
        expiresAt
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
      const { id } = req.params;
      const shares = await this.handoverService.getShares(parseInt(id), req.user!.id);

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
      const { id, shareId } = req.params;
      const success = await this.handoverService.deleteShare(parseInt(id), parseInt(shareId), req.user!.id);

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
      const { id } = req.params;
      const comments = await this.handoverService.getComments(parseInt(id), req.user!.id);

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
      const { id } = req.params;
      const { content, parentCommentId } = req.body;
      
      const comment = await this.handoverService.createComment(
        parseInt(id),
        content,
        req.user!.id,
        parentCommentId
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
      const { commentId } = req.params;
      const { content } = req.body;
      
      const comment = await this.handoverService.updateComment(parseInt(commentId), content, req.user!.id);

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
      const { commentId } = req.params;
      const success = await this.handoverService.deleteComment(parseInt(commentId), req.user!.id);

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
