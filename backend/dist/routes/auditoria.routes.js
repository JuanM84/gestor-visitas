"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditoria_controller_1 = require("../controllers/auditoria.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/auditoria
router.get('/', auth_middleware_1.verificarToken, (0, auth_middleware_1.verificarRol)(['Admin']), auditoria_controller_1.AuditoriaController.getLogs);
exports.default = router;
