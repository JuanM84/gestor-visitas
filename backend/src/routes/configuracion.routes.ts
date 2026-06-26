import { Router } from 'express';
import { ConfiguracionController } from '../controllers/configuracion.controller';
import { verificarToken, verificarRol } from '../middleware/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/configuracion/{clave}:
 *   get:
 *     summary: Obtener el valor de un parámetro de configuración
 *     description: Recupera el valor configurado para una clave específica.
 *     tags:
 *       - Configuración
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clave
 *         required: true
 *         schema:
 *           type: string
 *         description: Clave de configuración (ej. capacidad_por_turno).
 *     responses:
 *       200:
 *         description: Valor recuperado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clave:
 *                   type: string
 *                 valor:
 *                   type: string
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/:clave', verificarToken, ConfiguracionController.getParametro);

/**
 * @openapi
 * /api/configuracion/{clave}:
 *   put:
 *     summary: Actualizar el valor de un parámetro de configuración
 *     description: Modifica el valor configurado para una clave específica y audita la acción. Requiere rol de Administrador (Admin).
 *     tags:
 *       - Configuración
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clave
 *         required: true
 *         schema:
 *           type: string
 *         description: Clave de configuración.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - valor
 *             properties:
 *               valor:
 *                 type: string
 *                 example: "50"
 *     responses:
 *       200:
 *         description: Configuración guardada con éxito.
 *       400:
 *         description: El valor es requerido o formato inválido.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido (No es Administrador).
 */
router.put('/:clave', verificarToken, verificarRol(['Admin']), ConfiguracionController.updateParametro);

export default router;