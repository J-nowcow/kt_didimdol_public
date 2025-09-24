import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export function requireUserId(req: AuthRequest): number {
  // 개발 환경에서는 기본 사용자 ID 반환
  if (process.env.NODE_ENV === 'development') {
    return 1;
  }
  
  const userId = req.user?.id;
  if (typeof userId !== 'number') {
    throw new AppError('User not authenticated', 401, 'AUTH_ERROR');
  }
  return userId;
}
