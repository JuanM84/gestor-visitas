import puppeteer from 'puppeteer';
import { pool } from '../config/db';

export const ExportService = {
    async generarReporteMensualCSV(mes: number, anio: number) {
        // Traemos todas las visitas del mes con sus relaciones
        const query = `
            SELECT 
                v.fecha, 
                v.hora_inicio as hora, 
                gr.nombre as grupo, 
                g.nombre as institucion, 
                v.tipo, 
                v.cantidad_personas as personas,
                v.tiene_cruce_tunel as cruce,
                v.tiene_discapacidad as discapacidad,
                v.estado
            FROM Visita v
            JOIN Gestor g ON v.gestor_id = g.id
            JOIN Grupo gr ON v.grupo_id = gr.id
            WHERE EXTRACT(MONTH FROM v.fecha) = $1 AND EXTRACT(YEAR FROM v.fecha) = $2
            ORDER BY v.fecha ASC, v.hora_inicio ASC
        `;

        const result = await pool.query(query, [mes, anio]);
        const visitas = result.rows;

        // Definimos el encabezado del CSV
        let csvContent = "Fecha,Hora,Grupo,Institucion,Tipo,Personas,Cruce,Discapacidad,Estado\n";

        // Mapeamos los datos a filas del CSV
        visitas.forEach(v => {
            const fecha = new Date(v.fecha).toLocaleDateString('es-AR');
            const cruce = v.cruce ? "SI" : "NO";
            const discapacidad = v.discapacidad ? "SI" : "NO";

            // Escapamos comas en los nombres por seguridad
            const fila = [
                fecha,
                v.hora.slice(0, 5),
                `"${v.grupo}"`,
                `"${v.institucion}"`,
                v.tipo,
                v.personas,
                cruce,
                discapacidad,
                v.estado
            ].join(",");

            csvContent += fila + "\n";
        });

        return csvContent;
    },
    async generarReporteMensualPDF(mes: number, anio: number) {
        const query = `
            SELECT 
                v.fecha, 
                v.hora_inicio as hora, 
                gr.nombre as grupo, 
                g.nombre as institucion, 
                v.tipo, 
                v.cantidad_personas as personas,
                v.tiene_cruce_tunel as cruce,
                v.tiene_discapacidad as discapacidad,
                v.discapacidad_detalle
            FROM Visita v
            JOIN Gestor g ON v.gestor_id = g.id
            JOIN Grupo gr ON v.grupo_id = gr.id
            WHERE EXTRACT(MONTH FROM v.fecha) = $1 AND EXTRACT(YEAR FROM v.fecha) = $2
              AND v.estado != 'Cancelada'
            ORDER BY v.fecha ASC, v.hora_inicio ASC
        `;
        const result = await pool.query(query, [mes, anio]);
        const visitas = result.rows;

        const totalPersonas = visitas.reduce((acc, v) => acc + v.personas, 0);
        const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Helvetica', sans-serif; color: #333; margin: 0; padding: 20px; }
                .header { border-bottom: 2px solid #0369a1; padding-bottom: 10px; margin-bottom: 30px; }
                .header h1 { color: #0369a1; margin: 0; font-size: 22px; }
                .header p { color: #64748b; margin: 5px 0 0 0; font-size: 12px; }
                .info { margin-bottom: 20px; font-size: 14px; }
                .info b { color: #0369a1; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
                th { background-color: #f0f9ff; color: #0369a1; text-align: left; padding: 12px 8px; border-bottom: 2px solid #bae6fd; }
                td { padding: 10px 8px; border-bottom: 1px solid #f1f5f9; }
                .badge { padding: 3px 6px; border-radius: 4px; font-size: 9px; font-bold: true; }
                .badge-si { background-color: #dcfce7; color: #166534; }
                .badge-no { background-color: #f1f5f9; color: #64748b; }
                .summary { margin-top: 30px; float: right; width: 250px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; }
                .summary h3 { margin: 0 0 10px 0; font-size: 14px; color: #0369a1; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
                .summary-item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Túnel Subfluvial "Raúl Uranga - Carlos Sylvestre Begnis"</h1>
                <p>Sistema de Gestión de Visitas - Reporte de Actividad Mensual</p>
            </div>
            <div class="info">
                Reporte correspondiente a: <b>${nombresMeses[mes - 1]} de ${anio}</b><br>
                Fecha de generación: ${new Date().toLocaleDateString('es-AR')}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Grupo / Institución</th>
                        <th>Personas</th>
                        <th>Cruce</th>
                        <th>Accesibilidad</th>
                    </tr>
                </thead>
                <tbody>
                    ${visitas.map(v => `
                        <tr>
                            <td>${new Date(v.fecha).toLocaleDateString('es-AR')}</td>
                            <td>${v.hora.slice(0, 5)} hs</td>
                            <td><b>${v.grupo}</b><br>${v.institucion}</td>
                            <td><b>${v.personas}</b></td>
                            <td><span class="badge ${v.cruce ? 'badge-si' : 'badge-no'}">${v.cruce ? 'SÍ' : 'NO'}</span></td>
                            <td>${v.discapacidad ? `<span class="badge badge-si">SÍ</span>` : '<span class="badge badge-no">NO</span>'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="summary">
                <h3>Resumen Mensual</h3>
                <div class="summary-item">Total Visitas: <b>${visitas.length}</b></div>
                <div class="summary-item">Total Personas: <b>${totalPersonas}</b></div>
            </div>
        </body>
        </html>
        `;
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', bottom: '15mm', left: '10mm', right: '10mm' }
        });

        await browser.close();
        return pdfBuffer;
    }
};