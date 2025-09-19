import { prisma } from '../config/database';
import { MongoService } from './MongoService';
import { CacheService } from './CacheService';
import { AppError } from '../middleware/errorHandler';

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

export class HandoverService {
  private mongoService: MongoService;
  private cacheService: CacheService;

  constructor() {
    this.mongoService = new MongoService();
    this.cacheService = new CacheService();
  }

  // Get all handovers with filters
  async getAllHandovers(filters: HandoverFilters) {
    const { page, limit, status, search, sortBy, sortOrder, userId } = filters;
    const offset = (page - 1) * limit;

    const where: any = {
      authorId: userId
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    const orderBy: any = {};
    orderBy[sortBy || 'createdAt'] = sortOrder || 'desc';

    const [handovers, total] = await Promise.all([
      prisma.handoverDocument.findMany({
        where,
        include: {
          author: {
            select: { id: true, username: true, fullName: true, department: true }
          },
          _count: {
            select: { comments: true, shares: true }
          }
        },
        orderBy,
        skip: offset,
        take: limit
      }),
      prisma.handoverDocument.count({ where })
    ]);

    return {
      handovers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Create new handover
  async createHandover(data: CreateHandoverDto) {
    try {
      // Generate unique MongoDB ID
      const mongoId = this.generateMongoId();

      // Create in PostgreSQL
      const handover = await prisma.handoverDocument.create({
        data: {
          title: data.title,
          authorId: data.authorId,
          status: data.status || 'draft',
          priority: data.priority || 'medium',
          category: data.category,
          tags: data.tags || [],
          mongoId
        },
        include: {
          author: {
            select: { id: true, username: true, fullName: true, department: true }
          }
        }
      });

      // Create in MongoDB
      await this.mongoService.createContent({
        documentId: handover.id,
        version: 1,
        content: data.content,
        createdBy: data.authorId
      });

      // Invalidate cache
      await this.cacheService.invalidateUserHandovers(data.authorId);

      return handover;
    } catch (error) {
      throw new AppError('Failed to create handover', 500, 'CREATE_ERROR');
    }
  }

  // Get handover by ID
  async getHandoverById(id: number, userId: number) {
    try {
      // Check cache first
      const cacheKey = `handover:${id}`;
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Get from database
      const handover = await prisma.handoverDocument.findFirst({
        where: {
          id,
          OR: [
            { authorId: userId },
            { shares: { some: { sharedWithUserId: userId } } }
          ]
        },
        include: {
          author: {
            select: { id: true, username: true, fullName: true, department: true }
          },
          _count: {
            select: { comments: true, shares: true }
          }
        }
      });

      if (!handover) {
        return null;
      }

      // Get content from MongoDB
      const content = await this.mongoService.getContent(handover.mongoId);
      
      const result = { ...handover, content };

      // Cache the result
      await this.cacheService.set(cacheKey, result, 3600); // 1 hour

      return result;
    } catch (error) {
      throw new AppError('Failed to fetch handover', 500, 'FETCH_ERROR');
    }
  }

  // Update handover
  async updateHandover(id: number, data: UpdateHandoverDto, userId: number) {
    try {
      // Check if user has permission
      const handover = await prisma.handoverDocument.findFirst({
        where: {
          id,
          OR: [
            { authorId: userId },
            { shares: { some: { sharedWithUserId: userId, permissionLevel: { in: ['write', 'admin'] } } } }
          ]
        }
      });

      if (!handover) {
        return null;
      }

      // Update PostgreSQL
      const updatedHandover = await prisma.handoverDocument.update({
        where: { id },
        data: {
          title: data.title,
          status: data.status,
          priority: data.priority,
          category: data.category,
          tags: data.tags,
          updatedAt: new Date()
        },
        include: {
          author: {
            select: { id: true, username: true, fullName: true, department: true }
          }
        }
      });

      // Update MongoDB if content is provided
      if (data.content) {
        await this.mongoService.updateContent(handover.mongoId, data.content);
      }

      // Invalidate cache
      await this.cacheService.invalidateHandover(id);
      await this.cacheService.invalidateUserHandovers(userId);

      return updatedHandover;
    } catch (error) {
      throw new AppError('Failed to update handover', 500, 'UPDATE_ERROR');
    }
  }

  // Delete handover
  async deleteHandover(id: number, userId: number) {
    try {
      // Check if user has permission
      const handover = await prisma.handoverDocument.findFirst({
        where: {
          id,
          authorId: userId
        }
      });

      if (!handover) {
        return false;
      }

      // Delete from both databases
      await Promise.all([
        prisma.handoverDocument.delete({ where: { id } }),
        this.mongoService.deleteContent(handover.mongoId)
      ]);

      // Invalidate cache
      await this.cacheService.invalidateHandover(id);
      await this.cacheService.invalidateUserHandovers(userId);

      return true;
    } catch (error) {
      throw new AppError('Failed to delete handover', 500, 'DELETE_ERROR');
    }
  }

  // Create version
  async createVersion(documentId: number, changeSummary: string, userId: number) {
    try {
      const handover = await prisma.handoverDocument.findUnique({
        where: { id: documentId }
      });

      if (!handover) {
        throw new AppError('Handover not found', 404, 'NOT_FOUND');
      }

      // Get current content from MongoDB
      const currentContent = await this.mongoService.getContent(handover.mongoId);
      
      // Create new version in MongoDB
      const newMongoId = this.generateMongoId();
      await this.mongoService.createContent({
        documentId,
        version: currentContent.version + 1,
        content: currentContent.content,
        createdBy: userId
      });

      // Create version record in PostgreSQL
      const version = await prisma.handoverVersion.create({
        data: {
          documentId,
          versionNumber: currentContent.version + 1,
          mongoId: newMongoId,
          createdBy: userId,
          changeSummary
        }
      });

      return version;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create version', 500, 'CREATE_ERROR');
    }
  }

  // Get versions
  async getVersions(documentId: number, userId: number) {
    try {
      const handover = await prisma.handoverDocument.findFirst({
        where: {
          id: documentId,
          OR: [
            { authorId: userId },
            { shares: { some: { sharedWithUserId: userId } } }
          ]
        }
      });

      if (!handover) {
        throw new AppError('Handover not found', 404, 'NOT_FOUND');
      }

      const versions = await prisma.handoverVersion.findMany({
        where: { documentId },
        include: {
          creator: {
            select: { id: true, username: true, fullName: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return versions;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch versions', 500, 'FETCH_ERROR');
    }
  }

  // Share handover
  async shareHandover(documentId: number, sharedWithUserId: number, permissionLevel: string, sharedBy: number, expiresAt?: Date) {
    try {
      const handover = await prisma.handoverDocument.findFirst({
        where: {
          id: documentId,
          authorId: sharedBy
        }
      });

      if (!handover) {
        throw new AppError('Handover not found', 404, 'NOT_FOUND');
      }

      const share = await prisma.handoverShare.create({
        data: {
          documentId,
          sharedWithUserId,
          permissionLevel,
          sharedBy,
          expiresAt
        },
        include: {
          sharedWithUser: {
            select: { id: true, username: true, fullName: true, department: true }
          }
        }
      });

      return share;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to share handover', 500, 'SHARE_ERROR');
    }
  }

  // Get shares
  async getShares(documentId: number, userId: number) {
    try {
      const handover = await prisma.handoverDocument.findFirst({
        where: {
          id: documentId,
          authorId: userId
        }
      });

      if (!handover) {
        throw new AppError('Handover not found', 404, 'NOT_FOUND');
      }

      const shares = await prisma.handoverShare.findMany({
        where: { documentId },
        include: {
          sharedWithUser: {
            select: { id: true, username: true, fullName: true, department: true }
          }
        },
        orderBy: { sharedAt: 'desc' }
      });

      return shares;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch shares', 500, 'FETCH_ERROR');
    }
  }

  // Delete share
  async deleteShare(documentId: number, shareId: number, userId: number) {
    try {
      const share = await prisma.handoverShare.findFirst({
        where: {
          id: shareId,
          documentId,
          sharedBy: userId
        }
      });

      if (!share) {
        return false;
      }

      await prisma.handoverShare.delete({
        where: { id: shareId }
      });

      return true;
    } catch (error) {
      throw new AppError('Failed to delete share', 500, 'DELETE_ERROR');
    }
  }

  // Get comments
  async getComments(documentId: number, userId: number) {
    try {
      const handover = await prisma.handoverDocument.findFirst({
        where: {
          id: documentId,
          OR: [
            { authorId: userId },
            { shares: { some: { sharedWithUserId: userId } } }
          ]
        }
      });

      if (!handover) {
        throw new AppError('Handover not found', 404, 'NOT_FOUND');
      }

      const comments = await prisma.handoverComment.findMany({
        where: {
          documentId,
          isDeleted: false
        },
        include: {
          author: {
            select: { id: true, username: true, fullName: true, department: true }
          },
          replies: {
            where: { isDeleted: false },
            include: {
              author: {
                select: { id: true, username: true, fullName: true, department: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      return comments;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch comments', 500, 'FETCH_ERROR');
    }
  }

  // Create comment
  async createComment(documentId: number, content: string, authorId: number, parentCommentId?: number) {
    try {
      const handover = await prisma.handoverDocument.findFirst({
        where: {
          id: documentId,
          OR: [
            { authorId },
            { shares: { some: { sharedWithUserId: authorId } } }
          ]
        }
      });

      if (!handover) {
        throw new AppError('Handover not found', 404, 'NOT_FOUND');
      }

      const comment = await prisma.handoverComment.create({
        data: {
          documentId,
          authorId,
          content,
          parentCommentId
        },
        include: {
          author: {
            select: { id: true, username: true, fullName: true, department: true }
          }
        }
      });

      return comment;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create comment', 500, 'CREATE_ERROR');
    }
  }

  // Update comment
  async updateComment(commentId: number, content: string, userId: number) {
    try {
      const comment = await prisma.handoverComment.findFirst({
        where: {
          id: commentId,
          authorId: userId,
          isDeleted: false
        }
      });

      if (!comment) {
        return null;
      }

      const updatedComment = await prisma.handoverComment.update({
        where: { id: commentId },
        data: { content, updatedAt: new Date() },
        include: {
          author: {
            select: { id: true, username: true, fullName: true, department: true }
          }
        }
      });

      return updatedComment;
    } catch (error) {
      throw new AppError('Failed to update comment', 500, 'UPDATE_ERROR');
    }
  }

  // Delete comment
  async deleteComment(commentId: number, userId: number) {
    try {
      const comment = await prisma.handoverComment.findFirst({
        where: {
          id: commentId,
          authorId: userId,
          isDeleted: false
        }
      });

      if (!comment) {
        return false;
      }

      await prisma.handoverComment.update({
        where: { id: commentId },
        data: { isDeleted: true, updatedAt: new Date() }
      });

      return true;
    } catch (error) {
      throw new AppError('Failed to delete comment', 500, 'DELETE_ERROR');
    }
  }

  // Generate unique MongoDB ID
  private generateMongoId(): string {
    return `mongo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
