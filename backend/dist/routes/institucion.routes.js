"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const institucion_controller_1 = require("../controllers/institucion.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.verificarToken, institucion_controller_1.InstitucionController.getInstituciones);
router.post('/', auth_middleware_1.verificarToken, institucion_controller_1.InstitucionController.createInstitucion);
exports.default = router;
