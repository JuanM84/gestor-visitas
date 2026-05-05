import { Router } from 'express';
import { UsuarioController } from '../controllers/usuario.controller';
import { verificarToken, verificarRol } from '../middleware/auth.middleware';

const router = Router();

router.get('/', verificarToken, verificarRol(['Admin']), UsuarioController.getUsuarios);
router.post('/', verificarToken, verificarRol(['Admin']), UsuarioController.crearUsuario);

export default router;