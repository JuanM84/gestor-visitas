import { Router } from 'express';
import { AuditoriaController } from '../controllers/auditoria.controller';
import { verificarToken, verificarRol } from '../middleware/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/auditoria:
 *   get:
 *     summary: Obtener logs de auditoría
 *     description: Recupera la lista de logs de auditoría registrados en el sistema. Requiere rol de Administrador (Admin).
 *     tags:
 *       - Auditoría
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Cantidad máxima de logs a retornar.
 *     responses:
 *       200:
 *         description: Lista de logs de auditoría.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   accion:
 *                     type: string
 *                   fecha:
 *                     type: string
 *                     format: date-time
 *                   usuario_email:
 *                     type: string
 *                   usuario_rol:
 *                     type: string
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido (No tiene rol de Admin).
 */
router.get('/', verificarToken, verificarRol(['Admin']), AuditoriaController.getLogs);

export default router;