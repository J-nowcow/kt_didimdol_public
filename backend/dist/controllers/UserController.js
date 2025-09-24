"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const UserService_1 = require("../services/UserService");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../utils/auth");
class UserController {
    userService;
    constructor() {
        this.userService = new UserService_1.UserService();
    }
    getAllUsers = async (req, res) => {
        try {
            const { page = 1, limit = 10, search, department } = req.query;
            const users = await this.userService.getAllUsers({
                page: parseInt(page),
                limit: parseInt(limit),
                search: search,
                department: department
            });
            res.json({
                success: true,
                data: users
            });
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to fetch users', 500, 'FETCH_ERROR');
        }
    };
    getUserById = async (req, res) => {
        try {
            const { id } = req.params;
            const user = await this.userService.getUserById(parseInt(id));
            if (!user) {
                throw new errorHandler_1.AppError('User not found', 404, 'NOT_FOUND');
            }
            res.json({
                success: true,
                data: user
            });
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError('Failed to fetch user', 500, 'FETCH_ERROR');
        }
    };
    updateUser = async (req, res) => {
        try {
            const { id } = req.params;
            const user = await this.userService.updateUser(parseInt(id), req.body, (0, auth_1.requireUserId)(req));
            if (!user) {
                throw new errorHandler_1.AppError('User not found', 404, 'NOT_FOUND');
            }
            res.json({
                success: true,
                data: user
            });
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError('Failed to update user', 500, 'UPDATE_ERROR');
        }
    };
    getUserHandovers = async (req, res) => {
        try {
            const { id } = req.params;
            const { page = 1, limit = 10, status } = req.query;
            const handovers = await this.userService.getUserHandovers(parseInt(id), {
                page: parseInt(page),
                limit: parseInt(limit),
                status: status
            });
            res.json({
                success: true,
                data: handovers
            });
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to fetch user handovers', 500, 'FETCH_ERROR');
        }
    };
}
exports.UserController = UserController;
//# sourceMappingURL=UserController.js.map