import { Router } from 'express';
import { ConfiguracionController } from '../controllers/configuracion.controller';
import { verificarToken, verificarRol } from '../middleware/auth.middleware';

const router = Router();

// GET: Solo requiere estar logueado (verificarToken) para que el Dashboard funcione
router.get('/:clave', verificarToken, ConfiguracionController.getParametro);

// PUT: Requiere estar logueado Y ser Administrador (Doble validación)
router.put('/:clave', verificarToken, verificarRol(['Admin']), ConfiguracionController.updateParametro);

export default router;