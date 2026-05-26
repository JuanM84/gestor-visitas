"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const configuracion_controller_1 = require("../controllers/configuracion.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// GET: Solo requiere estar logueado (verificarToken) para que el Dashboard funcione
router.get('/:clave', auth_middleware_1.verificarToken, configuracion_controller_1.ConfiguracionController.getParametro);
// PUT: Requiere estar logueado Y ser Administrador (Doble validación)
router.put('/:clave', auth_middleware_1.verificarToken, (0, auth_middleware_1.verificarRol)(['Admin']), configuracion_controller_1.ConfiguracionController.updateParametro);
exports.default = router;
