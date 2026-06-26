import { Router } from 'express';
import { DiaInhabilController } from '../controllers/diaInhabil.controller';
import { verificarToken, verificarRol } from '../middleware/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/dias-inhabiles:
 *   get:
 *     summary: Obtener todos los días inhábiles
 *     description: Recupera la lista completa de fechas inhabilitadas para visitas.
 *     tags:
 *       - Días Inhábiles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de días inhábiles cargada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   fecha:
 *                     type: string
 *                     format: date
 *                   descripcion:
 *                     type: string
 *       401:
 *         description: No autorizado.
 */
router.get('/', verificarToken, DiaInhabilController.getDias);

/**
 * @openapi
 * /api/dias-inhabiles:
 *   post:
 *     summary: Registrar un día inhábil
 *     description: Añade una nueva fecha inhabilitada para el agendamiento de visitas. Requiere rol de Administrador (Admin).
 *     tags:
 *       - Días Inhábiles
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha
 *               - descripcion
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-07-09"
 *               descripcion:
 *                 type: string
 *                 example: "Día de la Independencia"
 *     responses:
 *       201:
 *         description: Día inhábil registrado con éxito.
 *       400:
 *         description: Datos inválidos.
 *       409:
 *         description: La fecha ya está registrada como día inhábil.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido.
 */
router.post('/', verificarToken, verificarRol(['Admin']), DiaInhabilController.addDia);

/**
 * @openapi
 * /api/dias-inhabiles/{id}:
 *   delete:
 *     summary: Eliminar un día inhábil
 *     description: Habilita nuevamente una fecha que había sido inhabilitada previamente. Requiere rol de Administrador (Admin).
 *     tags:
 *       - Días Inhábiles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del día inhábil.
 *     responses:
 *       204:
 *         description: Día inhábil eliminado correctamente (sin contenido de retorno).
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido.
 */
router.delete('/:id', verificarToken, verificarRol(['Admin']), DiaInhabilController.deleteDia);

export default router;