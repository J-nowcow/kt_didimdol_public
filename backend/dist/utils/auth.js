"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUserId = requireUserId;
const errorHandler_1 = require("../middleware/errorHandler");
function requireUserId(req) {
    const userId = req.user?.id;
    if (typeof userId !== 'number') {
        throw new errorHandler_1.AppError('User not authenticated', 401, 'AUTH_ERROR');
    }
    return userId;
}
//# sourceMappingURL=auth.js.map