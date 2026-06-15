import { Request, Response } from 'express';
import { ExportService } from '../services/export.service';

export const ExportController = {
    async exportarMensual(req: Request, res: Response) {
        try {
            const anio = parseInt(req.query.anio as string) || new Date().getFullYear();
            const mes = parseInt(req.query.mes as string) || (new Date().getMonth() + 1);
            const usuarioNombre = (req as any).usuario?.nombre || 'Sistema';

            const pdfBuffer = await ExportService.generarReporteMensualPDF(mes, anio, usuarioNombre);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Reporte_Visitas_${mes}_${anio}.pdf`);
            res.setHeader('Content-Length', pdfBuffer.length);

            res.end(pdfBuffer);

        } catch (error) {
            console.error("Error al exportar PDF mensual:", error);
            res.status(500).json({ error: 'No se pudo generar el archivo de exportación' });
        }
    },

    async exportarDiario(req: Request, res: Response) {
        try {
            const fecha = req.query.fecha as string;
            const usuarioNombre = (req as any).usuario?.nombre || 'Sistema';

            if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
                return res.status(400).json({ error: 'El parámetro fecha es requerido en formato YYYY-MM-DD' });
            }

            const pdfBuffer = await ExportService.generarReporteDiarioPDF(fecha, usuarioNombre);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Cronograma_${fecha}.pdf`);
            res.setHeader('Content-Length', pdfBuffer.length);

            res.end(pdfBuffer);

        } catch (error) {
            console.error("Error al exportar PDF diario:", error);
            res.status(500).json({ error: 'No se pudo generar el cronograma diario' });
        }
    },

    async exportarRango(req: Request, res: Response) {
        try {
            const fechaDesde = req.query.desde as string;
            const fechaHasta = req.query.hasta as string;
            const usuarioNombre = (req as any).usuario?.nombre || 'Sistema';

            if (!fechaDesde || !fechaHasta || !/^\d{4}-\d{2}-\d{2}$/.test(fechaDesde) || !/^\d{4}-\d{2}-\d{2}$/.test(fechaHasta)) {
                return res.status(400).json({ error: 'Los parámetros desde y hasta son requeridos en formato YYYY-MM-DD' });
            }

            const pdfBuffer = await ExportService.generarReporteRangoPDF(fechaDesde, fechaHasta, usuarioNombre);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Reporte_Visitas_${fechaDesde}_a_${fechaHasta}.pdf`);
            res.setHeader('Content-Length', pdfBuffer.length);

            res.end(pdfBuffer);

        } catch (error) {
            console.error("Error al exportar PDF por rango:", error);
            res.status(500).json({ error: 'No se pudo generar el reporte por rango de fechas' });
        }
    },

    async exportarComprobanteVisita(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const usuarioNombre = (req as any).usuario?.nombre || 'Sistema';
            
            if (!id) {
                return res.status(400).json({ error: 'El ID de la visita es requerido' });
            }

            const pdfBuffer = await ExportService.generarComprobanteVisitaPDF(id as string, usuarioNombre);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Comprobante_Visita_${id}.pdf`);
            res.setHeader('Content-Length', pdfBuffer.length);

            res.end(pdfBuffer);
        } catch (error) {
            console.error("Error al exportar comprobante de visita:", error);
            res.status(500).json({ error: 'No se pudo generar el comprobante de visita' });
        }
    },

    async exportarInformeStats(req: Request, res: Response) {
        try {
            const fechaDesde = req.query.desde as string;
            const fechaHasta = req.query.hasta as string;
            const titulo = req.query.titulo as string || '';
            const seccionesRaw = req.query.secciones as string || '';
            const usuarioNombre = (req as any).usuario?.nombre || 'Sistema';

            if (!fechaDesde || !fechaHasta || !/^\d{4}-\d{2}-\d{2}$/.test(fechaDesde) || !/^\d{4}-\d{2}-\d{2}$/.test(fechaHasta)) {
                return res.status(400).json({ error: 'Los parámetros desde y hasta son requeridos en formato YYYY-MM-DD' });
            }

            const secciones = seccionesRaw.split(',').filter(Boolean);
            if (secciones.length === 0) {
                return res.status(400).json({ error: 'Se debe seleccionar al menos una sección/estadística para el informe.' });
            }

            const pdfBuffer = await ExportService.generarInformeStatsPDF(fechaDesde, fechaHasta, titulo, secciones, usuarioNombre);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Informe_Estadisticas_${fechaDesde}_a_${fechaHasta}.pdf`);
            res.setHeader('Content-Length', pdfBuffer.length);

            res.end(pdfBuffer);

        } catch (error) {
            console.error("Error al exportar PDF de informe de estadísticas:", error);
            res.status(500).json({ error: 'No se pudo generar el informe de estadísticas' });
        }
    }
};