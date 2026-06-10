import { Router } from 'express';
import { GestorController } from '../controllers/gestor.controller';
import { verificarToken, verificarRol } from '../middleware/auth.middleware';

const router = Router();

router.get('/', verificarToken, GestorController.getGestores);
router.post('/', verificarToken, GestorController.createGestor);
router.put('/:id', verificarToken, GestorController.updateGestor);
router.delete('/:id', verificarToken, verificarRol(['Admin']), GestorController.deleteGestor);

export default router;