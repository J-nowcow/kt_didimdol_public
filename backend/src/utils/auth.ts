import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export function requireUserId(req: AuthRequest): number {
  const userId = req.user?.id;
  if (typeof userId !== 'number') {
    throw new AppError('User not authenticated', 401, 'AUTH_ERROR');
  }
  return userId;
}
