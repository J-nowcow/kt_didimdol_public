import request from 'supertest';
import express from 'express';
import { HandoverController } from '../controllers/HandoverController';
import { HandoverService } from '../services/HandoverService';
import { AppError } from '../middleware/errorHandler';

// Mock dependencies
jest.mock('../services/HandoverService');
jest.mock('../config/database');
jest.mock('../config/redis');

describe('HandoverController', () => {
  let app: express.Application;
  let mockHandoverService: jest.Mocked<HandoverService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    mockHandoverService = new HandoverService() as jest.Mocked<HandoverService>;
    const handoverController = new HandoverController();
    
    // Mock routes
    app.get('/api/handovers', (req, res) => {
      req.user = { id: 1, username: 'test', email: 'test@test.com' };
      handoverController.getAllHandovers(req as any, res);
    });
    
    app.post('/api/handovers', (req, res) => {
      req.user = { id: 1, username: 'test', email: 'test@test.com' };
      handoverController.createHandover(req as any, res);
    });
  });

  describe('GET /api/handovers', () => {
    it('should return handovers list', async () => {
      const mockHandovers = {
        handovers: [
          {
            id: 1,
            title: 'Test Handover',
            status: 'draft',
            author: { id: 1, username: 'test', fullName: 'Test User' }
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1
        }
      };

      mockHandoverService.getAllHandovers.mockResolvedValue(mockHandovers);

      const response = await request(app)
        .get('/api/handovers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.handovers).toHaveLength(1);
      expect(response.body.data.handovers[0].title).toBe('Test Handover');
    });

    it('should handle service errors', async () => {
      mockHandoverService.getAllHandovers.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/api/handovers')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FETCH_ERROR');
    });
  });

  describe('POST /api/handovers', () => {
    it('should create new handover', async () => {
      const handoverData = {
        title: 'New Handover',
        content: {
          sections: [
            {
              id: 'overview',
              title: 'Overview',
              content: 'Test content',
              order: 1,
              type: 'text'
            }
          ],
          metadata: {
            totalSections: 1,
            wordCount: 10,
            lastModifiedSection: 'overview'
          }
        }
      };

      const mockHandover = {
        id: 1,
        title: 'New Handover',
        authorId: 1,
        status: 'draft',
        mongoId: 'mongo_123'
      };

      mockHandoverService.createHandover.mockResolvedValue(mockHandover);

      const response = await request(app)
        .post('/api/handovers')
        .send(handoverData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Handover');
      expect(mockHandoverService.createHandover).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Handover',
          authorId: 1
        })
      );
    });

    it('should handle creation errors', async () => {
      mockHandoverService.createHandover.mockRejectedValue(new Error('Creation failed'));

      const response = await request(app)
        .post('/api/handovers')
        .send({ title: 'Test' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CREATE_ERROR');
    });
  });
});
