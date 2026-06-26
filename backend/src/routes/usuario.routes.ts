import { Router } from 'express';
import { UsuarioController } from '../controllers/usuario.controller';
import { verificarToken, verificarRol } from '../middleware/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/usuarios:
 *   get:
 *     summary: Obtener todos los usuarios
 *     description: Lista todos los usuarios registrados en el sistema. Requiere rol de Administrador.
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios cargada correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   email:
 *                     type: string
 *                   telefono:
 *                     type: string
 *                   rol:
 *                     type: string
 *                   activo:
 *                     type: boolean
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido.
 */
router.get('/', verificarToken, verificarRol(['Admin']), UsuarioController.getUsuarios);

/**
 * @openapi
 * /api/usuarios:
 *   post:
 *     summary: Registrar un nuevo usuario interno
 *     description: Crea un nuevo usuario interno en el sistema. Requiere rol de Administrador.
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - email
 *               - password
 *               - rol
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Mariela Fernández"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: mariela@tunel.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Mariela123!
 *               telefono:
 *                 type: string
 *                 example: "3434123456"
 *               rol:
 *                 type: string
 *                 enum: [Admin, Operador, Consultor]
 *                 example: "Operador"
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente.
 *       400:
 *         description: Datos inválidos o email ya registrado.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido.
 */
router.post('/', verificarToken, verificarRol(['Admin']), UsuarioController.crearUsuario);

/**
 * @openapi
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualizar datos de un usuario (Admin)
 *     description: Modifica los datos principales y rol de un usuario específico. Requiere rol de Administrador.
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               telefono:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [Admin, Operador, Consultor]
 *     responses:
 *       200:
 *         description: Usuario actualizado con éxito.
 *       400:
 *         description: Datos inválidos o error al guardar.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido.
 */
router.put('/:id', verificarToken, verificarRol(['Admin']), UsuarioController.actualizarDatos);

/**
 * @openapi
 * /api/usuarios/{id}/desactivar:
 *   patch:
 *     summary: Desactivar un usuario
 *     description: Cambia el estado del usuario a inactivo para inhabilitar su acceso. Evita que un administrador se desactive a sí mismo si es el único en el sistema. Requiere rol de Administrador.
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario desactivado correctamente.
 *       400:
 *         description: Operación inválida (ej. autodesactivación).
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido.
 */
router.patch('/:id/desactivar', verificarToken, verificarRol(['Admin']), UsuarioController.desactivarUsuario);

/**
 * @openapi
 * /api/usuarios/{id}/reactivar:
 *   patch:
 *     summary: Reactivar un usuario
 *     description: Restablece el estado activo de un usuario previamente desactivado. Requiere rol de Administrador.
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario reactivado correctamente.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido.
 */
router.patch('/:id/reactivar', verificarToken, verificarRol(['Admin']), UsuarioController.reactivarUsuario);

/**
 * @openapi
 * /api/usuarios/{id}/password:
 *   put:
 *     summary: Cambiar contraseña de un usuario
 *     description: Modifica la contraseña de acceso de un usuario. Puede ser solicitado por el propio usuario o por un Administrador.
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - passwordActual
 *               - nuevaPassword
 *             properties:
 *               passwordActual:
 *                 type: string
 *                 format: password
 *               nuevaPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Contraseña cambiada con éxito.
 *       400:
 *         description: Contraseña actual inválida o no cumple con requisitos.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido (No es el propietario ni un Admin).
 */
router.put('/:id/password', verificarToken, UsuarioController.cambiarPassword);

/**
 * @openapi
 * /api/usuarios/{id}/perfil:
 *   get:
 *     summary: Obtener el perfil del usuario autenticado
 *     description: Recupera los datos de perfil para un usuario. Solo lo puede consultar el propio usuario o un Administrador.
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del perfil de usuario.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido (No es el propietario ni un Admin).
 */
router.get('/:id/perfil', verificarToken, UsuarioController.obtenerPerfil);

/**
 * @openapi
 * /api/usuarios/{id}/perfil:
 *   put:
 *     summary: Actualizar el perfil propio
 *     description: Permite al usuario logueado modificar su propio email y teléfono.
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               telefono:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente.
 *       400:
 *         description: Datos inválidos.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido.
 */
router.put('/:id/perfil', verificarToken, UsuarioController.actualizarPerfil);

export default router;