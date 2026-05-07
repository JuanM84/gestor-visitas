import { Router } from 'express';
import { EstadisticasController } from '../controllers/estadisticas.controller';
import { ExportController } from '../controllers/export.controller';
import { verificarToken } from '../middleware/auth.middleware';

const router = Router();
// Asegúrate de tener un middleware que verifique si es Administrador si es necesario
router.get('/admin', verificarToken, EstadisticasController.getAdminDashboard);

router.get('/exportar', verificarToken, ExportController.exportarMensual);

export default router;