import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './errorHandler';

// Handover validation schema
const handoverSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  content: Joi.object({
    sections: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        title: Joi.string().required(),
        content: Joi.string().required(),
        order: Joi.number().integer().min(0).required(),
        type: Joi.string().valid('text', 'list', 'table', 'code').required()
      })
    ).required(),
    attachments: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        filename: Joi.string().required(),
        filepath: Joi.string().required(),
        fileSize: Joi.number().integer().min(0).required(),
        mimeType: Joi.string().required(),
        uploadedAt: Joi.date().required()
      })
    ).optional(),
    metadata: Joi.object({
      totalSections: Joi.number().integer().min(0).required(),
      wordCount: Joi.number().integer().min(0).required(),
      lastModifiedSection: Joi.string().required()
    }).required()
  }).required(),
  status: Joi.string().valid('draft', 'in_progress', 'completed', 'archived').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  category: Joi.string().max(100).optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional()
});

export const validateHandover = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = handoverSchema.validate(req.body);
  
  if (error) {
    throw new AppError(`Validation error: ${error.details[0]?.message}`, 400, 'VALIDATION_ERROR');
  }
  
  next();
};
