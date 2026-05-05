import { Router } from 'express';
import { DiaInhabilController } from '../controllers/diaInhabil.controller';
import { verificarToken, verificarRol } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas protegidas por el middleware
router.get('/', verificarToken, DiaInhabilController.getDias);
router.post('/', verificarToken, verificarRol(['Admin']), DiaInhabilController.addDia);
router.delete('/:id', verificarToken, verificarRol(['Admin']), DiaInhabilController.deleteDia);

export default router;