"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportController = void 0;
const export_service_1 = require("../services/export.service");
exports.ExportController = {
    async exportarMensual(req, res) {
        try {
            const anio = parseInt(req.query.anio) || new Date().getFullYear();
            const mes = parseInt(req.query.mes) || (new Date().getMonth() + 1);
            const pdfBuffer = await export_service_1.ExportService.generarReporteMensualPDF(mes, anio);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Reporte_Visitas_${mes}_${anio}.pdf`);
            res.setHeader('Content-Length', pdfBuffer.length);
            res.end(pdfBuffer);
        }
        catch (error) {
            console.error("Error al exportar PDF:", error);
            res.status(500).json({ error: 'No se pudo generar el archivo de exportación' });
        }
    }
};
