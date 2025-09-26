import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new AppError('Access token required', 401, 'TOKEN_REQUIRED');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number; username: string; email: string };
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email
    };
    next();
  } catch (error) {
    throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
  }
};
