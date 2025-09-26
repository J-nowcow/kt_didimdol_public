import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const userController = new UserController();

// Get all users
router.get('/', authenticateToken, userController.getAllUsers);

// Get user by ID
router.get('/:id', authenticateToken, userController.getUserById);

// Update user
router.put('/:id', authenticateToken, userController.updateUser);

// Get user's handovers
router.get('/:id/handovers', authenticateToken, userController.getUserHandovers);

export default router;
