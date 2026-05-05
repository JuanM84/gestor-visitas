import { Router } from 'express';
import { GestorController } from '../controllers/gestor.controller';
import { verificarToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', verificarToken, GestorController.getGestores);
router.post('/', verificarToken, GestorController.createGestor);

export default router;