"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const diaInhabil_controller_1 = require("../controllers/diaInhabil.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Todas las rutas protegidas por el middleware
router.get('/', auth_middleware_1.verificarToken, diaInhabil_controller_1.DiaInhabilController.getDias);
router.post('/', auth_middleware_1.verificarToken, (0, auth_middleware_1.verificarRol)(['Admin']), diaInhabil_controller_1.DiaInhabilController.addDia);
router.delete('/:id', auth_middleware_1.verificarToken, (0, auth_middleware_1.verificarRol)(['Admin']), diaInhabil_controller_1.DiaInhabilController.deleteDia);
exports.default = router;
