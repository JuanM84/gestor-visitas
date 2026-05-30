import { Router } from 'express';
import { UsuarioController } from '../controllers/usuario.controller';
import { verificarToken, verificarRol } from '../middleware/auth.middleware';

const router = Router();

// Listar y crear usuarios (solo Admin)
router.get('/', verificarToken, verificarRol(['Admin']), UsuarioController.getUsuarios);
router.post('/', verificarToken, verificarRol(['Admin']), UsuarioController.crearUsuario);

// Desactivar usuario — U-8 (solo Admin)
router.patch('/:id/desactivar', verificarToken, verificarRol(['Admin']), UsuarioController.desactivarUsuario);

// Cambiar contraseña — A-9 (propio usuario o Admin)
router.put('/:id/password', verificarToken, UsuarioController.cambiarPassword);

export default router;