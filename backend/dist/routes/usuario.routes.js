"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const usuario_controller_1 = require("../controllers/usuario.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.verificarToken, (0, auth_middleware_1.verificarRol)(['Admin']), usuario_controller_1.UsuarioController.getUsuarios);
router.post('/', auth_middleware_1.verificarToken, (0, auth_middleware_1.verificarRol)(['Admin']), usuario_controller_1.UsuarioController.crearUsuario);
exports.default = router;
