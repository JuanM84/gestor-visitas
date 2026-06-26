import { Router } from 'express';
import { EstadisticasController } from '../controllers/estadisticas.controller';
import { ExportController } from '../controllers/export.controller';
import { verificarToken, verificarRol } from '../middleware/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/estadisticas/admin:
 *   get:
 *     summary: Obtener estadísticas para el dashboard administrativo
 *     description: Recupera indicadores globales de visitas filtrados por año y mes.
 *     tags:
 *       - Estadísticas
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
 *         description: Número del mes del 1 al 12 (por defecto mes actual).
 *     responses:
 *       200:
 *         description: Estadísticas cargadas con éxito.
 *       401:
 *         description: No autorizado.
 */
router.get('/admin', verificarToken, EstadisticasController.getAdminDashboard);

/**
 * @openapi
 * /api/estadisticas/rango:
 *   get:
 *     summary: Obtener estadísticas agrupadas por rango de fechas
 *     description: Devuelve estadísticas detalladas (tipos, visitas por día, estado, etc.) dentro de un rango.
 *     tags:
 *       - Estadísticas
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
 *         description: Estadísticas por rango cargadas.
 *       400:
 *         description: Parámetros inválidos.
 *       401:
 *         description: No autorizado.
 */
router.get('/rango', verificarToken, EstadisticasController.getStatsByRango);

/**
 * @openapi
 * /api/estadisticas/exportar:
 *   get:
 *     summary: Exportar reporte de visitas mensual en PDF
 *     description: Genera y descarga un PDF con el cronograma y datos de visitas del mes seleccionado.
 *     tags:
 *       - Reportes / Exportación
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *         description: Año (por defecto año actual).
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *         description: Mes del 1 al 12 (por defecto mes actual).
 *     responses:
 *       200:
 *         description: PDF mensual generado correctamente.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: No autorizado.
 */
router.get('/exportar', verificarToken, ExportController.exportarMensual);

/**
 * @openapi
 * /api/estadisticas/exportar/diario:
 *   get:
 *     summary: Exportar cronograma diario en PDF
 *     description: Genera y descarga un PDF con las visitas programadas para un día en particular.
 *     tags:
 *       - Reportes / Exportación
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha a exportar (YYYY-MM-DD).
 *     responses:
 *       200:
 *         description: PDF diario generado correctamente.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Parámetro fecha faltante o inválido.
 *       401:
 *         description: No autorizado.
 */
router.get('/exportar/diario', verificarToken, ExportController.exportarDiario);

/**
 * @openapi
 * /api/estadisticas/exportar/rango:
 *   get:
 *     summary: Exportar reporte de visitas por rango de fechas en PDF
 *     description: Genera y descarga un PDF del listado de visitas en el rango y estados dados.
 *     tags:
 *       - Reportes / Exportación
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: desde
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: hasta
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: estados
 *         schema:
 *           type: string
 *         description: Estados de visita separados por coma (ej. Confirmada,Pendiente).
 *     responses:
 *       200:
 *         description: PDF por rango generado correctamente.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Fechas faltantes o inválidas.
 *       401:
 *         description: No autorizado.
 */
router.get('/exportar/rango', verificarToken, ExportController.exportarRango);

/**
 * @openapi
 * /api/estadisticas/exportar/visita/{id}:
 *   get:
 *     summary: Exportar comprobante de una visita específica en PDF
 *     description: Genera y descarga un comprobante detallado con código QR para una visita única por su ID.
 *     tags:
 *       - Reportes / Exportación
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la visita.
 *     responses:
 *       200:
 *         description: PDF del comprobante de visita generado con éxito.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: ID faltante.
 *       401:
 *         description: No autorizado.
 */
router.get('/exportar/visita/:id', verificarToken, ExportController.exportarComprobanteVisita);

/**
 * @openapi
 * /api/estadisticas/exportar/informe:
 *   get:
 *     summary: Exportar informe estadístico personalizado en PDF
 *     description: Genera un reporte gerencial consolidando los gráficos e indicadores de las secciones solicitadas. Requiere rol de Administrador.
 *     tags:
 *       - Reportes / Exportación
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: desde
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: hasta
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: titulo
 *         schema:
 *           type: string
 *         description: Título del informe.
 *       - in: query
 *         name: secciones
 *         required: true
 *         schema:
 *           type: string
 *         description: Secciones separadas por coma (ej. resumen,tipos,niveles,provincias,cruce).
 *     responses:
 *       200:
 *         description: PDF del informe de estadísticas generado con éxito.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Parámetros inválidos.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido.
 */
router.get('/exportar/informe', verificarToken, verificarRol(['Admin']), ExportController.exportarInformeStats);

export default router;