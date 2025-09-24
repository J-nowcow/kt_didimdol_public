"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const userController = new UserController_1.UserController();
router.get('/', auth_1.authenticateToken, userController.getAllUsers);
router.get('/:id', auth_1.authenticateToken, userController.getUserById);
router.put('/:id', auth_1.authenticateToken, userController.updateUser);
router.get('/:id/handovers', auth_1.authenticateToken, userController.getUserHandovers);
exports.default = router;
//# sourceMappingURL=user.js.map