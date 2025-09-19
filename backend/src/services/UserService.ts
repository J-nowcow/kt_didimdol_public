import { prisma } from '../config/database';
import { CacheService } from './CacheService';
import { AppError } from '../middleware/errorHandler';

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

export class UserService {
  private cacheService: CacheService;

  constructor() {
    this.cacheService = new CacheService();
  }

  // Get all users with filters
  async getAllUsers(filters: UserFilters) {
    const { page, limit, search, department } = filters;
    const offset = (page - 1) * limit;

    const where: any = {
      isActive: true
    };

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (department) {
      where.department = department;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          department: true,
          position: true,
          createdAt: true,
          _count: {
            select: { handovers: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get user by ID
  async getUserById(id: number) {
    try {
      // Check cache first
      const cacheKey = `user:${id}`;
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          department: true,
          position: true,
          createdAt: true,
          updatedAt: true,
          isActive: true,
          _count: {
            select: { 
              handovers: true,
              comments: true,
              shares: true
            }
          }
        }
      });

      if (user) {
        // Cache the result
        await this.cacheService.set(cacheKey, user, 3600); // 1 hour
      }

      return user;
    } catch (error) {
      throw new AppError('Failed to fetch user', 500, 'FETCH_ERROR');
    }
  }

  // Update user
  async updateUser(id: number, data: any, userId: number) {
    try {
      // Check if user has permission to update
      if (id !== userId) {
        throw new AppError('Unauthorized to update this user', 403, 'UNAUTHORIZED');
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          fullName: data.fullName,
          department: data.department,
          position: data.position,
          updatedAt: new Date()
        },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          department: true,
          position: true,
          createdAt: true,
          updatedAt: true,
          isActive: true
        }
      });

      // Invalidate cache
      await this.cacheService.invalidateUser(id);

      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update user', 500, 'UPDATE_ERROR');
    }
  }

  // Get user's handovers
  async getUserHandovers(userId: number, filters: HandoverFilters) {
    try {
      const { page, limit, status } = filters;
      const offset = (page - 1) * limit;

      const where: any = {
        authorId: userId
      };

      if (status) {
        where.status = status;
      }

      const [handovers, total] = await Promise.all([
        prisma.handoverDocument.findMany({
          where,
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            category: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
            completedAt: true,
            _count: {
              select: { comments: true, shares: true }
            }
          },
          orderBy: { createdAt: 'desc' },
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
    } catch (error) {
      throw new AppError('Failed to fetch user handovers', 500, 'FETCH_ERROR');
    }
  }
}
