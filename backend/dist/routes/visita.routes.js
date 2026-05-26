"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const visita_controller_1 = require("../controllers/visita.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/visitas?fecha=YYYY-MM-DD
router.get('/', auth_middleware_1.verificarToken, visita_controller_1.VisitaController.getVisitasDashboard);
// POST /api/visitas
router.post('/', auth_middleware_1.verificarToken, visita_controller_1.VisitaController.crearVisita);
// GET /api/visitas/calendario?anio=2026&mes=4
router.get('/calendario', auth_middleware_1.verificarToken, visita_controller_1.VisitaController.getCalendario);
// GET /api/visitas/historial
router.get('/historial', auth_middleware_1.verificarToken, visita_controller_1.VisitaController.getHistorial);
// PATCH /api/visitas/:id/cancelar
router.patch('/:id/cancelar', auth_middleware_1.verificarToken, visita_controller_1.VisitaController.cancelarVisita);
// GET /api/visitas/:id
router.get('/:id', auth_middleware_1.verificarToken, visita_controller_1.VisitaController.getById);
// PUT /api/visitas/:id
router.put('/:id', auth_middleware_1.verificarToken, visita_controller_1.VisitaController.updateVisita);
exports.default = router;
