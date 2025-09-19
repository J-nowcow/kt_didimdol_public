import { Router } from 'express';
import { HandoverController } from '../controllers/HandoverController';
import { authenticateToken } from '../middleware/auth';
import { validateHandover } from '../middleware/validation';

const router = Router();
const handoverController = new HandoverController();

// Get all handovers
router.get('/', authenticateToken, handoverController.getAllHandovers);

// Create new handover
router.post('/', authenticateToken, validateHandover, handoverController.createHandover);

// Get handover by ID
router.get('/:id', authenticateToken, handoverController.getHandoverById);

// Update handover
router.put('/:id', authenticateToken, validateHandover, handoverController.updateHandover);

// Delete handover
router.delete('/:id', authenticateToken, handoverController.deleteHandover);

// Create version
router.post('/:id/versions', authenticateToken, handoverController.createVersion);

// Get versions
router.get('/:id/versions', authenticateToken, handoverController.getVersions);

// Share handover
router.post('/:id/share', authenticateToken, handoverController.shareHandover);

// Get shares
router.get('/:id/shares', authenticateToken, handoverController.getShares);

// Delete share
router.delete('/:id/shares/:shareId', authenticateToken, handoverController.deleteShare);

// Get comments
router.get('/:id/comments', authenticateToken, handoverController.getComments);

// Create comment
router.post('/:id/comments', authenticateToken, handoverController.createComment);

// Update comment
router.put('/comments/:commentId', authenticateToken, handoverController.updateComment);

// Delete comment
router.delete('/comments/:commentId', authenticateToken, handoverController.deleteComment);

export default router;
