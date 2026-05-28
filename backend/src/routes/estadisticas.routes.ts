import { Router } from 'express';
import { EstadisticasController } from '../controllers/estadisticas.controller';
import { ExportController } from '../controllers/export.controller';
import { verificarToken } from '../middleware/auth.middleware';

const router = Router();
router.get('/admin', verificarToken, EstadisticasController.getAdminDashboard);
router.get('/rango', verificarToken, EstadisticasController.getStatsByRango);
router.get('/exportar', verificarToken, ExportController.exportarMensual);
router.get('/exportar/diario', verificarToken, ExportController.exportarDiario);

export default router;