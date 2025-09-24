"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const logger_1 = require("../utils/logger");
class AppError extends Error {
    statusCode;
    code;
    isOperational;
    constructor(message, statusCode, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (error, req, res, next) => {
    let { statusCode = 500, message, code = 'INTERNAL_ERROR' } = error;
    logger_1.logger.error('API Error:', {
        error: {
            message,
            statusCode,
            code,
            stack: error.stack,
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        }
    });
    if (error.name === 'ValidationError') {
        statusCode = 400;
        code = 'VALIDATION_ERROR';
    }
    else if (error.name === 'CastError') {
        statusCode = 400;
        code = 'INVALID_ID';
        message = 'Invalid ID format';
    }
    else if (error.name === 'MongoError' && error.code === 11000) {
        statusCode = 409;
        code = 'DUPLICATE_KEY';
        message = 'Duplicate field value';
    }
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        code = 'INVALID_TOKEN';
        message = 'Invalid token';
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        code = 'TOKEN_EXPIRED';
        message = 'Token expired';
    }
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'Internal server error';
    }
    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        }
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map