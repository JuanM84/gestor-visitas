import { Request, Response } from 'express';
import { ExportService } from '../services/export.service';

export const ExportController = {
    async exportarMensual(req: Request, res: Response) {
        try {
            const anio = parseInt(req.query.anio as string) || new Date().getFullYear();
            const mes = parseInt(req.query.mes as string) || (new Date().getMonth() + 1);

            const pdfBuffer = await ExportService.generarReporteMensualPDF(mes, anio);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Reporte_Visitas_${mes}_${anio}.pdf`);
            res.setHeader('Content-Length', pdfBuffer.length);

            res.end(pdfBuffer);

        } catch (error) {
            console.error("Error al exportar PDF:", error);
            res.status(500).json({ error: 'No se pudo generar el archivo de exportación' });
        }
    }
};