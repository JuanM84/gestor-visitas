"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gestor_controller_1 = require("../controllers/gestor.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.verificarToken, gestor_controller_1.GestorController.getGestores);
router.post('/', auth_middleware_1.verificarToken, gestor_controller_1.GestorController.createGestor);
exports.default = router;
