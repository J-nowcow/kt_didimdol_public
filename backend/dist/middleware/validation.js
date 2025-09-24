"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateHandover = void 0;
const joi_1 = __importDefault(require("joi"));
const errorHandler_1 = require("./errorHandler");
const handoverSchema = joi_1.default.object({
    title: joi_1.default.string().min(1).max(255).required(),
    content: joi_1.default.object({
        sections: joi_1.default.array().items(joi_1.default.object({
            id: joi_1.default.string().required(),
            title: joi_1.default.string().required(),
            content: joi_1.default.string().required(),
            order: joi_1.default.number().integer().min(0).required(),
            type: joi_1.default.string().valid('text', 'list', 'table', 'code').required()
        })).required(),
        attachments: joi_1.default.array().items(joi_1.default.object({
            id: joi_1.default.string().required(),
            filename: joi_1.default.string().required(),
            filepath: joi_1.default.string().required(),
            fileSize: joi_1.default.number().integer().min(0).required(),
            mimeType: joi_1.default.string().required(),
            uploadedAt: joi_1.default.date().required()
        })).optional(),
        metadata: joi_1.default.object({
            totalSections: joi_1.default.number().integer().min(0).required(),
            wordCount: joi_1.default.number().integer().min(0).required(),
            lastModifiedSection: joi_1.default.string().required()
        }).required()
    }).required(),
    status: joi_1.default.string().valid('draft', 'in_progress', 'completed', 'archived').optional(),
    priority: joi_1.default.string().valid('low', 'medium', 'high', 'urgent').optional(),
    category: joi_1.default.string().max(100).optional(),
    tags: joi_1.default.array().items(joi_1.default.string().max(50)).optional()
});
const validateHandover = (req, res, next) => {
    const { error } = handoverSchema.validate(req.body);
    if (error) {
        throw new errorHandler_1.AppError(`Validation error: ${error.details[0]?.message}`, 400, 'VALIDATION_ERROR');
    }
    next();
};
exports.validateHandover = validateHandover;
//# sourceMappingURL=validation.js.map