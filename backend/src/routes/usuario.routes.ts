import { Router } from 'express';
import { UsuarioController } from '../controllers/usuario.controller';
import { verificarToken, verificarRol } from '../middleware/auth.middleware';

const router = Router();

// Listar y crear usuarios (solo Admin)
router.get('/', verificarToken, verificarRol(['Admin']), UsuarioController.getUsuarios);
router.post('/', verificarToken, verificarRol(['Admin']), UsuarioController.crearUsuario);

// Editar datos de usuario (solo Admin)
router.put('/:id', verificarToken, verificarRol(['Admin']), UsuarioController.actualizarDatos);

// Desactivar y reactivar usuario (solo Admin)
router.patch('/:id/desactivar', verificarToken, verificarRol(['Admin']), UsuarioController.desactivarUsuario);
router.patch('/:id/reactivar', verificarToken, verificarRol(['Admin']), UsuarioController.reactivarUsuario);

// Cambiar contraseña — A-9 (propio usuario o Admin)
router.put('/:id/password', verificarToken, UsuarioController.cambiarPassword);

// Perfil propio — leer y actualizar (email, teléfono)
router.get('/:id/perfil', verificarToken, UsuarioController.obtenerPerfil);
router.put('/:id/perfil', verificarToken, UsuarioController.actualizarPerfil);

export default router;