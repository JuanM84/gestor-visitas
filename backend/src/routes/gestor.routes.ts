import { Router } from 'express';
import { GestorController } from '../controllers/gestor.controller';
import { verificarToken, verificarRol } from '../middleware/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/gestores:
 *   get:
 *     summary: Obtener todos los gestores
 *     description: Recupera el listado completo de gestores registrados.
 *     tags:
 *       - Gestores
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de gestores cargada con éxito.
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
 *                   tipo:
 *                     type: string
 *                   empresa_institucion:
 *                     type: string
 *                   telefono:
 *                     type: string
 *                   email:
 *                     type: string
 *                   localidad:
 *                     type: string
 *                   provincia:
 *                     type: string
 *                   pais:
 *                     type: string
 *       401:
 *         description: No autorizado.
 */
router.get('/', verificarToken, GestorController.getGestores);

/**
 * @openapi
 * /api/gestores:
 *   post:
 *     summary: Crear un nuevo gestor
 *     description: Registra un gestor en el sistema.
 *     tags:
 *       - Gestores
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
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Carlos Gómez"
 *               tipo:
 *                 type: string
 *                 enum: ['Institución Educativa', 'Agencia de Turismo', 'Club / Asociación', 'Particular / Organismo Público']
 *                 example: "Agencia de Turismo"
 *               empresa_institucion:
 *                 type: string
 *                 example: "Turismo Aventura"
 *               telefono:
 *                 type: string
 *                 example: "0343-4201234"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: carlos@turismo.com
 *               localidad:
 *                 type: string
 *                 example: "Paraná"
 *               provincia:
 *                 type: string
 *                 example: "Entre Ríos"
 *               pais:
 *                 type: string
 *                 example: "Argentina"
 *     responses:
 *       201:
 *         description: Gestor creado exitosamente.
 *       400:
 *         description: Datos inválidos.
 *       401:
 *         description: No autorizado.
 */
router.post('/', verificarToken, GestorController.createGestor);

/**
 * @openapi
 * /api/gestores/{id}:
 *   put:
 *     summary: Actualizar un gestor existente
 *     description: Modifica los datos de un gestor específico.
 *     tags:
 *       - Gestores
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
 *               tipo:
 *                 type: string
 *               empresa_institucion:
 *                 type: string
 *               telefono:
 *                 type: string
 *               email:
 *                 type: string
 *               localidad:
 *                 type: string
 *               provincia:
 *                 type: string
 *               pais:
 *                 type: string
 *     responses:
 *       200:
 *         description: Gestor actualizado exitosamente.
 *       400:
 *         description: Datos inválidos.
 *       401:
 *         description: No autorizado.
 */
router.put('/:id', verificarToken, GestorController.updateGestor);

/**
 * @openapi
 * /api/gestores/{id}:
 *   delete:
 *     summary: Eliminar un gestor
 *     description: Elimina un gestor del sistema. Requiere rol de Administrador.
 *     tags:
 *       - Gestores
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
 *         description: Gestor eliminado exitosamente.
 *       400:
 *         description: Error al eliminar el gestor (ej. tiene visitas asociadas).
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido.
 */
router.delete('/:id', verificarToken, verificarRol(['Admin']), GestorController.deleteGestor);

export default router;