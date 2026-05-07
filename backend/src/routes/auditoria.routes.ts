import { Router } from 'express';
import { AuditoriaController } from '../controllers/auditoria.controller';
import { verificarToken, verificarRol } from '../middleware/auth.middleware';

const router = Router();

// GET /api/auditoria
router.get('/', verificarToken, verificarRol(['Admin']), AuditoriaController.getLogs);

export default router;