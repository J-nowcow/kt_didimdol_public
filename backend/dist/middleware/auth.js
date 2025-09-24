"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        throw new errorHandler_1.AppError('Access token required', 401, 'TOKEN_REQUIRED');
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            username: decoded.username,
            email: decoded.email
        };
        next();
    }
    catch (error) {
        throw new errorHandler_1.AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
    }
};
exports.authenticateToken = authenticateToken;
//# sourceMappingURL=auth.js.map