import { Router } from 'express';
import { VisitaController } from '../controllers/visita.controller';
import { verificarToken } from '../middleware/auth.middleware';

const router = Router();

// GET /api/visitas?fecha=YYYY-MM-DD
router.get('/', verificarToken, VisitaController.getVisitasDashboard);

// GET /api/visitas/rango?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
router.get('/rango', verificarToken, VisitaController.getVisitasRango);

// POST /api/visitas
router.post('/', verificarToken, VisitaController.crearVisita);

// GET /api/visitas/calendario?anio=2026&mes=4
router.get('/calendario', verificarToken, VisitaController.getCalendario);

// GET /api/visitas/historial
router.get('/historial', verificarToken, VisitaController.getHistorial);

// PATCH /api/visitas/:id/cancelar
router.patch('/:id/cancelar', verificarToken, VisitaController.cancelarVisita);

// GET /api/visitas/:id
router.get('/:id', verificarToken, VisitaController.getById);

// PUT /api/visitas/:id
router.put('/:id', verificarToken, VisitaController.updateVisita);

export default router;