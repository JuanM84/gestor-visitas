import { Router } from 'express';
import { VisitaController } from '../controllers/visita.controller';
import { verificarToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/visitas:
 *   get:
 *     summary: Obtener visitas para el Dashboard operativo
 *     description: Retorna todas las visitas registradas para una fecha determinada (por defecto hoy).
 *     tags:
 *       - Visitas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha a consultar en formato YYYY-MM-DD.
 *     responses:
 *       200:
 *         description: Lista de visitas obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fecha:
 *                   type: string
 *                 total:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: No autorizado (Token inválido o ausente).
 */
router.get('/', verificarToken, VisitaController.getVisitasDashboard);

/**
 * @openapi
 * /api/visitas/rango:
 *   get:
 *     summary: Obtener visitas por rango de fechas
 *     description: Devuelve todas las visitas dentro de un período de tiempo especificado.
 *     tags:
 *       - Visitas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: desde
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (YYYY-MM-DD).
 *       - in: query
 *         name: hasta
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD).
 *     responses:
 *       200:
 *         description: Lista de visitas para el rango.
 *       400:
 *         description: Parámetros inválidos.
 *       401:
 *         description: No autorizado.
 */
router.get('/rango', verificarToken, VisitaController.getVisitasRango);

/**
 * @openapi
 * /api/visitas:
 *   post:
 *     summary: Registrar una nueva visita
 *     description: Crea un nuevo registro de visita, asociando gestor y grupo (particular o institucional).
 *     tags:
 *       - Visitas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grupo
 *               - visita
 *             properties:
 *               gestor_id:
 *                 type: integer
 *                 description: ID del gestor existente.
 *               nuevoGestor:
 *                 type: object
 *                 properties:
 *                   nombre:
 *                     type: string
 *                   telefono:
 *                     type: string
 *                   email:
 *                     type: string
 *               grupo:
 *                 type: object
 *                 required:
 *                   - tipo_visitante
 *                 properties:
 *                   tipo_visitante:
 *                     type: string
 *                     enum: [Institución, Particulares]
 *                   nivel_educativo:
 *                     type: string
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
 *               visita:
 *                 type: object
 *                 required:
 *                   - fecha
 *                   - hora_inicio
 *                   - tipo
 *                   - cantidad_personas
 *                 properties:
 *                   fecha:
 *                     type: string
 *                     format: date
 *                   hora_inicio:
 *                     type: string
 *                     example: "09:00"
 *                   tipo:
 *                     type: string
 *                   cantidad_personas:
 *                     type: integer
 *                   tiene_cruce_tunel:
 *                     type: boolean
 *                   tiene_discapacidad:
 *                     type: boolean
 *                   discapacidad_detalle:
 *                     type: string
 *     responses:
 *       201:
 *         description: Visita creada con éxito.
 *       400:
 *         description: Error de validación o conflicto de capacidad.
 *       401:
 *         description: No autorizado.
 */
router.post('/', verificarToken, VisitaController.crearVisita);

/**
 * @openapi
 * /api/visitas/calendario:
 *   get:
 *     summary: Obtener datos de ocupación mensual para calendario
 *     description: Retorna un mapa del mes con la cantidad de visitas y estado de ocupación por día.
 *     tags:
 *       - Visitas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *         description: Año a consultar (por defecto año actual).
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *         description: Número de mes del 1 al 12 (por defecto mes actual).
 *     responses:
 *       200:
 *         description: Datos de ocupación cargados con éxito.
 *       401:
 *         description: No autorizado.
 */
router.get('/calendario', verificarToken, VisitaController.getCalendario);

/**
 * @openapi
 * /api/visitas/historial:
 *   get:
 *     summary: Obtener historial paginado de visitas
 *     description: Recupera todas las visitas pasadas e históricas con soporte para paginación.
 *     tags:
 *       - Visitas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Historial de visitas obtenido.
 *       401:
 *         description: No autorizado.
 */
router.get('/historial', verificarToken, VisitaController.getHistorial);

/**
 * @openapi
 * /api/visitas/{id}/cancelar:
 *   patch:
 *     summary: Cancelar una visita registrada
 *     description: Cambia el estado de una visita a 'Cancelada' y registra un motivo de cancelación.
 *     tags:
 *       - Visitas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la visita.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               motivo:
 *                 type: string
 *                 example: "Mal clima"
 *     responses:
 *       200:
 *         description: Visita cancelada exitosamente.
 *       404:
 *         description: Visita no encontrada.
 *       409:
 *         description: La visita ya estaba cancelada.
 *       401:
 *         description: No autorizado.
 */
router.patch('/:id/cancelar', verificarToken, VisitaController.cancelarVisita);

/**
 * @openapi
 * /api/visitas/{id}:
 *   get:
 *     summary: Obtener el detalle de una visita por ID
 *     description: Retorna la información completa de la visita, incluyendo gestor, grupo e institución vinculados.
 *     tags:
 *       - Visitas
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
 *         description: Detalle de la visita obtenido con éxito.
 *       404:
 *         description: Visita no encontrada.
 *       401:
 *         description: No autorizado.
 */
router.get('/:id', verificarToken, VisitaController.getById);

/**
 * @openapi
 * /api/visitas/{id}:
 *   put:
 *     summary: Modificar una visita existente
 *     description: Actualiza los detalles generales, el gestor asignado o la institución asociada de una visita.
 *     tags:
 *       - Visitas
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
 *               fecha:
 *                 type: string
 *                 format: date
 *               hora_inicio:
 *                 type: string
 *               cantidad_personas:
 *                 type: integer
 *               estado:
 *                 type: string
 *               tipo:
 *                 type: string
 *               tiene_cruce_tunel:
 *                 type: boolean
 *               tiene_discapacidad:
 *                 type: boolean
 *               discapacidad_detalle:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Visita modificada exitosamente.
 *       400:
 *         description: Error en los datos proporcionados o validaciones fallidas.
 *       401:
 *         description: No autorizado.
 */
router.put('/:id', verificarToken, VisitaController.updateVisita);

export default router;