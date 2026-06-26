import { Router } from 'express';
import { InstitucionController } from '../controllers/institucion.controller';
import { verificarToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/instituciones:
 *   get:
 *     summary: Obtener todas las instituciones
 *     description: Recupera la lista completa de instituciones registradas en el sistema.
 *     tags:
 *       - Instituciones
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de instituciones cargada con éxito.
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
router.get('/', verificarToken, InstitucionController.getInstituciones);

/**
 * @openapi
 * /api/instituciones:
 *   post:
 *     summary: Registrar una nueva institución
 *     description: Crea una institución en el sistema.
 *     tags:
 *       - Instituciones
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
 *                 example: "Colegio Nacional de Paraná"
 *               telefono:
 *                 type: string
 *                 example: "0343-4231234"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: contacto@colegionacional.edu.ar
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
 *         description: Institución creada exitosamente.
 *       400:
 *         description: Datos inválidos.
 *       401:
 *         description: No autorizado.
 */
router.post('/', verificarToken, InstitucionController.createInstitucion);

export default router;
