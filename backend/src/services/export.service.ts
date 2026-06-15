import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { pool } from '../config/db';
import { VisitaRepository } from '../repositories/visita.repository';

/**
 * Obtiene el ejecutable de Chromium correcto según el entorno.
 * - En producción (Render/Linux): usa @sparticuz/chromium (binario precompilado).
 * - En desarrollo (Windows/Mac): usa el Chrome local del sistema.
 */
async function getBrowserInstance() {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
        return puppeteer.launch({
            args: chromium.args,
            defaultViewport: null,
            executablePath: await chromium.executablePath(),
            headless: true,
        });
    } else {
        // En Windows local, busca Chrome en las rutas más comunes
        const localChromePaths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        ];
        return puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: localChromePaths.find(p => {
                try { require('fs').accessSync(p); return true; } catch { return false; }
            }),
            headless: true,
        });
    }
}

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
    async generarReporteMensualPDF(mes: number, anio: number, usuarioNombre: string) {
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
                .badge { padding: 3px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
                .badge-si { background-color: #dcfce7; color: #166534; }
                .badge-no { background-color: #f1f5f9; color: #64748b; }
                .summary { margin-top: 30px; float: right; width: 250px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; }
                .summary h3 { margin: 0 0 10px 0; font-size: 14px; color: #0369a1; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
                .summary-item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
                .pdf-footer {
                    clear: both;
                    margin-top: 40px;
                    border-top: 1px solid #cbd5e1;
                    padding-top: 10px;
                    text-align: center;
                    font-size: 10px;
                    color: #64748b;
                }
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
            <div class="pdf-footer">
                Generado ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs - ${usuarioNombre}
            </div>
        </body>
        </html>
        `;
        const browser = await getBrowserInstance();
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'load' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', bottom: '15mm', left: '10mm', right: '10mm' }
        });

        await browser.close();
        return pdfBuffer;
    },

    async generarReporteDiarioPDF(fecha: string, usuarioNombre: string) {
        const query = `
            SELECT
                v.hora_inicio  AS hora,
                gr.nombre      AS grupo,
                g.nombre       AS gestor,
                gr.tipo_visitante,
                gr.nivel_educativo,
                gr.tipo_grupo,
                v.tipo,
                v.cantidad_personas AS personas,
                v.tiene_cruce_tunel AS cruce,
                v.tiene_discapacidad AS discapacidad,
                v.discapacidad_detalle,
                gr.observaciones,
                v.estado
            FROM Visita v
            JOIN Gestor g  ON v.gestor_id = g.id
            JOIN Grupo  gr ON v.grupo_id  = gr.id
            WHERE v.fecha = $1
              AND v.estado != 'Cancelada'
            ORDER BY v.hora_inicio ASC
        `;
        const result = await pool.query(query, [fecha]);
        const visitas = result.rows;

        const totalPersonas = visitas.reduce((acc: number, v: any) => acc + parseInt(v.personas), 0);
        const totalCruces   = visitas.filter((v: any) => v.cruce).length;

        // Formatea "2026-05-28" → "28/05/2026 (miércoles)"
        const fechaObj = new Date(fecha + 'T12:00:00');
        const fechaFormateada = fechaObj.toLocaleDateString('es-AR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

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
                td { padding: 10px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
                .badge { padding: 3px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
                .badge-si { background-color: #dcfce7; color: #166534; }
                .badge-no { background-color: #f1f5f9; color: #64748b; }
                .obs { font-size: 9px; color: #64748b; margin-top: 3px; }
                .summary { margin-top: 30px; float: right; width: 250px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; }
                .summary h3 { margin: 0 0 10px 0; font-size: 14px; color: #0369a1; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
                .summary-item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
                .empty { text-align: center; padding: 40px; color: #94a3b8; font-style: italic; }
                .pdf-footer {
                    clear: both;
                    margin-top: 40px;
                    border-top: 1px solid #cbd5e1;
                    padding-top: 10px;
                    text-align: center;
                    font-size: 10px;
                    color: #64748b;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Túnel Subfluvial "Raúl Uranga - Carlos Sylvestre Begnis"</h1>
                <p>Sistema de Gestión de Visitas - Cronograma Diario</p>
            </div>
            <div class="info">
                Cronograma del día: <b>${fechaFormateada}</b><br>
                Generado: ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
            </div>
            ${visitas.length === 0
                ? `<div class="empty">No hay visitas agendadas para este día.</div>`
                : `
            <table>
                <thead>
                    <tr>
                        <th>Hora</th>
                        <th>Grupo / Gestor</th>
                        <th>Tipo Visita</th>
                        <th>Personas</th>
                        <th>Cruce</th>
                        <th>Accesibilidad</th>
                    </tr>
                </thead>
                <tbody>
                    ${visitas.map((v: any) => `
                        <tr>
                            <td><b>${String(v.hora).slice(0, 5)} hs</b></td>
                            <td>
                                <b>${v.grupo}</b><br>
                                <span style="color:#64748b;font-size:10px;">${v.gestor}</span>
                                ${v.observaciones ? `<div class="obs">📝 ${v.observaciones}</div>` : ''}
                            </td>
                            <td>${v.tipo}</td>
                            <td><b>${v.personas}</b></td>
                            <td><span class="badge ${v.cruce ? 'badge-si' : 'badge-no'}">${v.cruce ? 'SÍ' : 'NO'}</span></td>
                            <td>${v.discapacidad
                                ? `<span class="badge badge-si">SÍ</span>${v.discapacidad_detalle ? `<div class="obs">${v.discapacidad_detalle}</div>` : ''}`
                                : '<span class="badge badge-no">NO</span>'
                            }</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="summary">
                <h3>Resumen del Día</h3>
                <div class="summary-item">Total Visitas: <b>${visitas.length}</b></div>
                <div class="summary-item">Total Personas: <b>${totalPersonas}</b></div>
                <div class="summary-item">Cruces Túnel: <b>${totalCruces}</b></div>
            </div>
            `}
            <div class="pdf-footer">
                Generado ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs - ${usuarioNombre}
            </div>
        </body>
        </html>
        `;

        const browser = await getBrowserInstance();
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'load' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', bottom: '15mm', left: '10mm', right: '10mm' }
        });

        await browser.close();
        return pdfBuffer;
    },

    async generarReporteRangoPDF(fechaDesde: string, fechaHasta: string, usuarioNombre: string) {
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
            WHERE v.fecha BETWEEN $1 AND $2
              AND v.estado != 'Cancelada'
            ORDER BY v.fecha ASC, v.hora_inicio ASC
        `;
        const result = await pool.query(query, [fechaDesde, fechaHasta]);
        const visitas = result.rows;

        const totalPersonas = visitas.reduce((acc: number, v: any) => acc + parseInt(v.personas), 0);

        const formatFecha = (f: string) => {
            const [y, m, d] = f.split('-');
            return `${d}/${m}/${y}`;
        };

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
                .badge { padding: 3px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
                .badge-si { background-color: #dcfce7; color: #166534; }
                .badge-no { background-color: #f1f5f9; color: #64748b; }
                .summary { margin-top: 30px; float: right; width: 250px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; }
                .summary h3 { margin: 0 0 10px 0; font-size: 14px; color: #0369a1; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
                .summary-item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
                .empty { text-align: center; padding: 40px; color: #94a3b8; font-style: italic; }
                .pdf-footer {
                    clear: both;
                    margin-top: 40px;
                    border-top: 1px solid #cbd5e1;
                    padding-top: 10px;
                    text-align: center;
                    font-size: 10px;
                    color: #64748b;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Túnel Subfluvial "Raúl Uranga - Carlos Sylvestre Begnis"</h1>
                <p>Sistema de Gestión de Visitas - Reporte de Actividad por Rango de Fechas</p>
            </div>
            <div class="info">
                Período: Desde <b>${formatFecha(fechaDesde)}</b> hasta <b>${formatFecha(fechaHasta)}</b><br>
                Fecha de generación: ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
            </div>
            ${visitas.length === 0
                ? `<div class="empty">No hay visitas registradas en este período.</div>`
                : `
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
                    ${visitas.map(v => {
                        const dateStr = new Date(v.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' });
                        return `
                        <tr>
                            <td>${dateStr}</td>
                            <td>${v.hora.slice(0, 5)} hs</td>
                            <td><b>${v.grupo}</b><br>${v.institucion}</td>
                            <td><b>${v.personas}</b></td>
                            <td><span class="badge ${v.cruce ? 'badge-si' : 'badge-no'}">${v.cruce ? 'SÍ' : 'NO'}</span></td>
                            <td>${v.discapacidad ? `<span class="badge badge-si">SÍ</span>` : '<span class="badge badge-no">NO</span>'}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <div class="summary">
                <h3>Resumen del Período</h3>
                <div class="summary-item">Total Visitas: <b>${visitas.length}</b></div>
                <div class="summary-item">Total Personas: <b>${totalPersonas}</b></div>
            </div>
            `}
            <div class="pdf-footer">
                Generado ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs - ${usuarioNombre}
            </div>
        </body>
        </html>
        `;

        const browser = await getBrowserInstance();
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'load' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', bottom: '15mm', left: '10mm', right: '10mm' }
        });

        await browser.close();
        return pdfBuffer;
    },

    async generarComprobanteVisitaPDF(id: string, usuarioNombre: string) {
        const v = await VisitaRepository.getById(id);
        if (!v) throw new Error('La visita no existe');

        const formatFecha = (f: any) => {
            try {
                const fechaObj = new Date(f);
                return fechaObj.toLocaleDateString('es-AR', { timeZone: 'UTC' });
            } catch { return String(f); }
        };

        const esInstitucion = v.tipo_visitante === 'Institución';

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                    color: #1e293b; 
                    background-color: #f1f5f9;
                    margin: 0; 
                    padding: 30px; 
                    display: flex;
                    justify-content: center;
                    -webkit-print-color-adjust: exact;
                }
                .modal-card {
                    background-color: #ffffff;
                    border-radius: 20px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
                    width: 100%;
                    max-width: 650px;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                }
                .modal-header {
                    background-color: #004a77;
                    color: #ffffff;
                    padding: 20px 24px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .header-icon-container {
                    width: 44px;
                    height: 44px;
                    background-color: rgba(255, 255, 255, 0.15);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .header-icon-container svg {
                    width: 24px;
                    height: 24px;
                    fill: #ffffff;
                }
                .header-text {
                    display: flex;
                    flex-direction: column;
                }
                .header-text h2 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 800;
                    line-height: 1.2;
                }
                .header-text p {
                    margin: 3px 0 0 0;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.75);
                    font-weight: 500;
                }
                .modal-body {
                    padding: 24px;
                }
                .section-card {
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 16px;
                    margin-bottom: 16px;
                }
                .section-card:last-child {
                    margin-bottom: 0;
                }
                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #475569;
                    margin-top: 0;
                    margin-bottom: 12px;
                }
                .section-title svg {
                    width: 16px;
                    height: 16px;
                    fill: #475569;
                }
                .grid-2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                .info-item {
                    margin-bottom: 4px;
                }
                .info-label {
                    font-size: 11px;
                    font-weight: 500;
                    color: #64748b;
                    display: block;
                    margin-bottom: 2px;
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }
                .info-value {
                    font-size: 13px;
                    font-weight: 700;
                    color: #0f172a;
                }
                .info-value-highlight {
                    font-size: 14px;
                    font-weight: 800;
                    color: #004a77;
                }
                .gestor-name, .grupo-name {
                    font-size: 14px;
                    font-weight: 700;
                    color: #0f172a;
                    margin: 0;
                }
                .gestor-empresa {
                    font-size: 12px;
                    color: #64748b;
                    margin: 2px 0 0 0;
                }
                .detail-list {
                    margin-top: 12px;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 12px;
                }
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    margin-bottom: 6px;
                }
                .detail-row:last-child {
                    margin-bottom: 0;
                }
                .detail-label {
                    color: #64748b;
                }
                .detail-value {
                    font-weight: 600;
                    color: #334155;
                }
                .badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 2px 8px;
                    border-radius: 9999px;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .badge-si {
                    background-color: #f0fdf4;
                    color: #166534;
                    border: 1px solid #bbf7d0;
                }
                .badge-no {
                    background-color: #f8fafc;
                    color: #475569;
                    border: 1px solid #e2e8f0;
                }
                .badge-info {
                    background-color: #e0f2fe;
                    color: #0369a1;
                    border: 1px solid #bae6fd;
                }
                .footer-text {
                    text-align: center;
                    font-size: 10px;
                    color: #94a3b8;
                    margin-top: 24px;
                    line-height: 1.4;
                }
            </style>
        </head>
        <body>
            <div class="modal-card">
                <div class="modal-header">
                    <div class="header-icon-container">
                        <!-- SVG Check Icon -->
                        <svg viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                    </div>
                    <div class="header-text">
                        <h2>Confirmar Registro de Visita</h2>
                        <p>Detalle de los datos registrados</p>
                    </div>
                </div>

                <div class="modal-body">
                    <!-- Sección Turno -->
                    <div class="section-card">
                        <div class="section-title">
                            <!-- SVG Calendar Icon -->
                            <svg viewBox="0 0 24 24">
                                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                            </svg>
                            Turno
                        </div>
                        <div class="grid-2">
                            <div>
                                <div class="info-item">
                                    <span class="info-label">Fecha</span>
                                    <span class="info-value">${formatFecha(v.fecha)}</span>
                                </div>
                                <div style="margin-top: 10px;" class="info-item">
                                    <span class="info-label">Tipo de visita</span>
                                    <span class="info-value">${v.tipo}</span>
                                </div>
                            </div>
                            <div>
                                <div class="info-item">
                                    <span class="info-label">Hora</span>
                                    <span class="info-value-highlight">${v.hora_inicio.slice(0, 5)} hs</span>
                                </div>
                                <div style="margin-top: 10px;" class="info-item">
                                    <span class="info-label">Cantidad de personas</span>
                                    <span class="info-value">${v.cantidad_personas}</span>
                                </div>
                            </div>
                        </div>

                        <div class="detail-list">
                            <div class="detail-row">
                                <span class="detail-label">Accesibilidad:</span>
                                <span class="detail-value">
                                    <span class="badge ${v.tiene_discapacidad ? 'badge-si' : 'badge-no'}">
                                        ${v.tiene_discapacidad ? 'SÍ' : 'NO'}
                                    </span>
                                </span>
                            </div>
                            ${v.tiene_discapacidad && v.discapacidad_detalle ? `
                            <div class="detail-row" style="margin-top: 4px;">
                                <span class="detail-label">Detalle accesibilidad:</span>
                                <span class="detail-value" style="color: #0f172a;">${v.discapacidad_detalle}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Sección Gestor -->
                    <div class="section-card">
                        <div class="section-title">
                            <!-- SVG Account Icon -->
                            <svg viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm-1 9c-2.33 0-7 1.17-7 3.5V20h14v-2c0-2.33-4.67-3.5-7-3.5zm-5.07-4.18C8.98 9.53 10.42 9 12 9s3.02.53 4.07 1.32c-1.45.69-2.73 1.77-3.62 3.12-.15-.02-.3-.04-.45-.04-2.33 0-7 1.17-7 3.5v.18c0-.79.37-1.55.93-2.12.56-.57 1.34-.96 2.07-1.14-.99-1.28-1.41-2.92-1.07-4.5z"/>
                            </svg>
                            Gestor Responsable
                        </div>
                        <p class="gestor-name">${v.gestor_nombre || '—'}</p>
                        ${v.gestor_empresa ? `<p class="gestor-empresa">${v.gestor_empresa}</p>` : ''}
                        
                        <div class="detail-list">
                            ${v.gestor_telefono ? `
                            <div class="detail-row">
                                <span class="detail-label">Teléfono:</span>
                                <span class="detail-value">${v.gestor_telefono}</span>
                            </div>
                            ` : ''}
                            ${v.gestor_email ? `
                            <div class="detail-row">
                                <span class="detail-label">Email:</span>
                                <span class="detail-value">${v.gestor_email}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Sección Grupo / Institución -->
                    <div class="section-card">
                        <div class="section-title">
                            ${esInstitucion ? `
                                <!-- SVG School Icon -->
                                <svg viewBox="0 0 24 24">
                                    <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91v6.27h2V9L12 3z"/>
                                </svg>
                                Institución Educativa
                            ` : `
                                <!-- SVG Group Icon -->
                                <svg viewBox="0 0 24 24">
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-1.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 2 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z"/>
                                </svg>
                                Grupo Particular
                            `}
                        </div>
                        <p class="grupo-name">${esInstitucion ? (v.institucion_nombre || '—') : (v.grupo_nombre || '—')}</p>
                        
                        <div class="detail-list">
                            ${esInstitucion ? `
                                <div class="detail-row">
                                    <span class="detail-label">Nivel Educativo:</span>
                                    <span class="detail-value">${v.nivel_educativo || '—'}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Localidad:</span>
                                    <span class="detail-value">
                                        ${[v.institucion_localidad, v.institucion_provincia].filter(Boolean).join(', ') || '—'}
                                    </span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">País:</span>
                                    <span class="detail-value">${v.institucion_pais || 'Argentina'}</span>
                                </div>
                                ${v.institucion_telefono ? `
                                <div class="detail-row">
                                    <span class="detail-label">Teléfono:</span>
                                    <span class="detail-value">${v.institucion_telefono}</span>
                                </div>
                                ` : ''}
                                ${v.institucion_email ? `
                                <div class="detail-row">
                                    <span class="detail-label">Email:</span>
                                    <span class="detail-value">${v.institucion_email}</span>
                                </div>
                                ` : ''}
                            ` : `
                                <div class="detail-row">
                                    <span class="detail-label">Tipo de Grupo:</span>
                                    <span class="detail-value">${v.tipo_grupo || '—'}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Localidad:</span>
                                    <span class="detail-value">
                                        ${[v.grupo_localidad, v.grupo_provincia].filter(Boolean).join(', ') || '—'}
                                    </span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">País:</span>
                                    <span class="detail-value">${v.grupo_pais || 'Argentina'}</span>
                                </div>
                                ${v.grupo_telefono ? `
                                <div class="detail-row">
                                    <span class="detail-label">Teléfono:</span>
                                    <span class="detail-value">${v.grupo_telefono}</span>
                                </div>
                                ` : ''}
                                ${v.grupo_email ? `
                                <div class="detail-row">
                                    <span class="detail-label">Email:</span>
                                    <span class="detail-value">${v.grupo_email}</span>
                                </div>
                                ` : ''}
                            `}
                        </div>
                    </div>
                </div>

                <div class="footer-text">
                    Túnel Subfluvial "Raúl Uranga - Carlos Sylvestre Begnis"<br>
                    Documento de confirmación de turno. Generado ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs - ${usuarioNombre}
                </div>
            </div>
        </body>
        </html>
        `;

        const browser = await getBrowserInstance();
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'load' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' }
        });

        await browser.close();
        return pdfBuffer;
    },

    async generarInformeStatsPDF(fechaDesde: string, fechaHasta: string, titulo: string, secciones: string[], usuarioNombre: string) {
        const formatFecha = (f: string) => {
            const [y, m, d] = f.split('-');
            return `${d}/${m}/${y}`;
        };

        let tituloInforme = titulo.trim();
        const isInst = secciones.some(s => s.startsWith('inst_'));
        if (!tituloInforme) {
            tituloInforme = `Informe ${formatFecha(fechaDesde)} - ${formatFecha(fechaHasta)}`;
            if (isInst) {
                tituloInforme += ' - Instituciones';
            }
        } else {
            if (isInst && !tituloInforme.toLowerCase().endsWith(' - instituciones')) {
                tituloInforme += ' - Instituciones';
            }
        }

        let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { 
                    font-family: 'Helvetica', sans-serif; 
                    color: #334155; 
                    margin: 0; 
                    padding: 0; 
                    background-color: #ffffff;
                    -webkit-print-color-adjust: exact;
                }
                @page {
                    size: A4 portrait;
                    margin: 0;
                }
                @page landscape-page {
                    size: A4 landscape;
                    margin: 0;
                }
                .page {
                    padding: 15mm;
                    page-break-after: always;
                    box-sizing: border-box;
                    width: 210mm;
                    height: 297mm;
                    display: flex;
                    flex-direction: column;
                    background-color: #ffffff;
                }
                .page.landscape-page {
                    page: landscape-page;
                    width: 297mm;
                    height: 210mm;
                }
                .page:last-child {
                    page-break-after: avoid;
                }
                .header { 
                    border-bottom: 2px solid #004a77; 
                    padding-bottom: 10px; 
                    margin-bottom: 25px; 
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }
                .header h1 { 
                    color: #004a77; 
                    margin: 0; 
                    font-size: 20px; 
                    font-weight: 800;
                }
                .header p { 
                    color: #64748b; 
                    margin: 5px 0 0 0; 
                    font-size: 11px; 
                }
                .logo-placeholder {
                    font-weight: 900;
                    color: #004a77;
                    font-size: 14px;
                    letter-spacing: 1px;
                }
                .report-title-container {
                    margin-bottom: 30px;
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 15px 20px;
                }
                .report-title {
                    font-size: 22px;
                    color: #0f172a;
                    margin: 0 0 8px 0;
                    font-weight: bold;
                }
                .report-subtitle {
                    font-size: 12px;
                    color: #64748b;
                    margin: 0;
                }
                .section-title-container {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border-bottom: 1px solid #cbd5e1;
                    padding-bottom: 8px;
                    margin-bottom: 20px;
                }
                .section-title {
                    font-size: 16px;
                    font-weight: bold;
                    color: #004a77;
                    margin: 0;
                }
                .grid-2 {
                    display: flex;
                    gap: 30px;
                    margin-top: 15px;
                }
                .col-chart {
                    flex: 1.2;
                }
                .col-table {
                    flex: 0.8;
                }
                .chart-container {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    background: #ffffff;
                    border: 1px solid #f1f5f9;
                    padding: 15px;
                    border-radius: 12px;
                }
                .chart-row {
                    display: flex;
                    align-items: center;
                }
                .chart-label {
                    width: 120px;
                    font-size: 10px;
                    font-weight: 600;
                    color: #475569;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    padding-right: 8px;
                    text-align: right;
                }
                .chart-bar-wrapper {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .chart-bar-container {
                    flex: 1;
                    background-color: #f1f5f9;
                    height: 12px;
                    border-radius: 6px;
                    overflow: hidden;
                }
                .chart-bar {
                    background: linear-gradient(90deg, #0284c7 0%, #004a77 100%);
                    height: 100%;
                    border-radius: 6px;
                }
                .chart-value {
                    font-size: 10px;
                    font-weight: bold;
                    color: #004a77;
                    min-width: 30px;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    font-size: 10px; 
                }
                th { 
                    background-color: #f8fafc; 
                    color: #475569; 
                    text-align: left; 
                    padding: 8px; 
                    border-bottom: 2px solid #e2e8f0; 
                    font-weight: 700;
                }
                td { 
                    padding: 8px; 
                    border-bottom: 1px solid #f1f5f9; 
                }
                tr:last-child td {
                    border-bottom: none;
                }
                .text-right {
                    text-align: right;
                }
                .font-bold {
                    font-weight: bold;
                }
                .total-row {
                    background-color: #f8fafc;
                    font-weight: bold;
                    border-top: 1px solid #e2e8f0;
                }
                .footer {
                    margin-top: auto;
                    text-align: center;
                    font-size: 9px;
                    color: #94a3b8;
                    border-top: 1px solid #f1f5f9;
                    padding-top: 10px;
                }
                .empty-state {
                    padding: 40px;
                    text-align: center;
                    color: #94a3b8;
                    font-style: italic;
                    background-color: #f8fafc;
                    border-radius: 12px;
                    border: 1px dashed #cbd5e1;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
        `;

        for (const sec of secciones) {
            let sectionTitle = '';
            let labelHeader = '';
            let rows: any[] = [];

            if (sec === 'nacionales') {
                sectionTitle = 'Visitantes Nacionales';
                labelHeader = 'Provincia';
                const q = `
                    SELECT
                        COALESCE(NULLIF(TRIM(COALESCE(inst.provincia, gr.provincia)), ''), 'Sin especificar') AS label,
                        COUNT(v.id)              AS visitas,
                        SUM(v.cantidad_personas) AS personas
                    FROM Visita v
                    JOIN Grupo gr ON v.grupo_id = gr.id
                    LEFT JOIN Institucion inst ON gr.institucion_id = inst.id
                    WHERE v.fecha BETWEEN $1 AND $2
                      AND v.estado != 'Cancelada'
                      AND UPPER(TRIM(COALESCE(inst.pais, gr.pais, ''))) IN ('ARGENTINA', '')
                      AND COALESCE(inst.provincia, gr.provincia) IS NOT NULL AND TRIM(COALESCE(inst.provincia, gr.provincia)) != ''
                    GROUP BY COALESCE(NULLIF(TRIM(COALESCE(inst.provincia, gr.provincia)), ''), 'Sin especificar')
                    ORDER BY personas DESC
                    LIMIT 15
                `;
                const res = await pool.query(q, [fechaDesde, fechaHasta]);
                rows = res.rows;
            } else if (sec === 'extranjeros') {
                sectionTitle = 'Visitantes Extranjeros';
                labelHeader = 'País';
                const q = `
                    SELECT
                        COALESCE(NULLIF(TRIM(COALESCE(inst.pais, gr.pais)), ''), 'Sin especificar') AS label,
                        COUNT(v.id)              AS visitas,
                        SUM(v.cantidad_personas) AS personas
                    FROM Visita v
                    JOIN Grupo gr ON v.grupo_id = gr.id
                    LEFT JOIN Institucion inst ON gr.institucion_id = inst.id
                    WHERE v.fecha BETWEEN $1 AND $2
                      AND v.estado != 'Cancelada'
                      AND UPPER(TRIM(COALESCE(inst.pais, gr.pais, ''))) NOT IN ('ARGENTINA', '')
                      AND COALESCE(inst.pais, gr.pais) IS NOT NULL AND TRIM(COALESCE(inst.pais, gr.pais)) != ''
                    GROUP BY COALESCE(NULLIF(TRIM(COALESCE(inst.pais, gr.pais)), ''), 'Sin especificar')
                    ORDER BY personas DESC
                    LIMIT 15
                `;
                const res = await pool.query(q, [fechaDesde, fechaHasta]);
                rows = res.rows;
            } else if (sec === 'entrerios') {
                sectionTitle = 'Visitantes de Entre Ríos';
                labelHeader = 'Localidad';
                const q = `
                    SELECT
                        COALESCE(NULLIF(TRIM(COALESCE(inst.localidad, gr.localidad)), ''), 'Sin especificar') AS label,
                        COUNT(v.id)              AS visitas,
                        SUM(v.cantidad_personas) AS personas
                    FROM Visita v
                    JOIN Grupo gr ON v.grupo_id = gr.id
                    LEFT JOIN Institucion inst ON gr.institucion_id = inst.id
                    WHERE v.fecha BETWEEN $1 AND $2
                      AND v.estado != 'Cancelada'
                      AND LOWER(TRIM(COALESCE(inst.provincia, gr.provincia, ''))) ILIKE '%entre r%'
                      AND COALESCE(inst.localidad, gr.localidad) IS NOT NULL AND TRIM(COALESCE(inst.localidad, gr.localidad)) != ''
                    GROUP BY COALESCE(NULLIF(TRIM(COALESCE(inst.localidad, gr.localidad)), ''), 'Sin especificar')
                    ORDER BY personas DESC
                    LIMIT 15
                `;
                const res = await pool.query(q, [fechaDesde, fechaHasta]);
                rows = res.rows;
            } else if (sec === 'santafe') {
                sectionTitle = 'Visitantes de Santa Fe';
                labelHeader = 'Localidad';
                const q = `
                    SELECT
                        COALESCE(NULLIF(TRIM(COALESCE(inst.localidad, gr.localidad)), ''), 'Sin especificar') AS label,
                        COUNT(v.id)              AS visitas,
                        SUM(v.cantidad_personas) AS personas
                    FROM Visita v
                    JOIN Grupo gr ON v.grupo_id = gr.id
                    LEFT JOIN Institucion inst ON gr.institucion_id = inst.id
                    WHERE v.fecha BETWEEN $1 AND $2
                      AND v.estado != 'Cancelada'
                      AND LOWER(TRIM(COALESCE(inst.provincia, gr.provincia, ''))) ILIKE '%santa fe%'
                      AND COALESCE(inst.localidad, gr.localidad) IS NOT NULL AND TRIM(COALESCE(inst.localidad, gr.localidad)) != ''
                    GROUP BY COALESCE(NULLIF(TRIM(COALESCE(inst.localidad, gr.localidad)), ''), 'Sin especificar')
                    ORDER BY personas DESC
                    LIMIT 15
                `;
                const res = await pool.query(q, [fechaDesde, fechaHasta]);
                rows = res.rows;
            } else if (sec === 'inst_niveles') {
                sectionTitle = 'Niveles Educativos';
                labelHeader = 'Nivel Educativo';
                const q = `
                    SELECT
                        COALESCE(NULLIF(TRIM(gr.nivel_educativo), ''), 'Sin especificar') AS label,
                        COUNT(v.id)              AS visitas,
                        SUM(v.cantidad_personas) AS personas
                    FROM Visita v
                    JOIN Grupo gr ON v.grupo_id = gr.id
                    WHERE v.fecha BETWEEN $1 AND $2
                      AND v.estado != 'Cancelada'
                      AND gr.tipo_visitante = 'Institución'
                    GROUP BY COALESCE(NULLIF(TRIM(gr.nivel_educativo), ''), 'Sin especificar')
                    ORDER BY personas DESC
                `;
                const res = await pool.query(q, [fechaDesde, fechaHasta]);
                rows = res.rows;
            } else if (sec === 'inst_entrerios') {
                sectionTitle = 'Localidades de Entre Ríos (Instituciones)';
                labelHeader = 'Localidad';
                const q = `
                    SELECT
                        COALESCE(NULLIF(TRIM(COALESCE(inst.localidad, gr.localidad)), ''), 'Sin especificar') AS label,
                        COUNT(v.id)              AS visitas,
                        SUM(v.cantidad_personas) AS personas
                    FROM Visita v
                    JOIN Grupo gr ON v.grupo_id = gr.id
                    LEFT JOIN Institucion inst ON gr.institucion_id = inst.id
                    WHERE v.fecha BETWEEN $1 AND $2
                      AND v.estado != 'Cancelada'
                      AND gr.tipo_visitante = 'Institución'
                      AND LOWER(TRIM(COALESCE(inst.provincia, gr.provincia, ''))) ILIKE '%entre r%'
                      AND COALESCE(inst.localidad, gr.localidad) IS NOT NULL AND TRIM(COALESCE(inst.localidad, gr.localidad)) != ''
                    GROUP BY COALESCE(NULLIF(TRIM(COALESCE(inst.localidad, gr.localidad)), ''), 'Sin especificar')
                    ORDER BY personas DESC
                    LIMIT 15
                `;
                const res = await pool.query(q, [fechaDesde, fechaHasta]);
                rows = res.rows;
            } else if (sec === 'inst_santafe') {
                sectionTitle = 'Localidades de Santa Fe (Instituciones)';
                labelHeader = 'Localidad';
                const q = `
                    SELECT
                        COALESCE(NULLIF(TRIM(COALESCE(inst.localidad, gr.localidad)), ''), 'Sin especificar') AS label,
                        COUNT(v.id)              AS visitas,
                        SUM(v.cantidad_personas) AS personas
                    FROM Visita v
                    JOIN Grupo gr ON v.grupo_id = gr.id
                    LEFT JOIN Institucion inst ON gr.institucion_id = inst.id
                    WHERE v.fecha BETWEEN $1 AND $2
                      AND v.estado != 'Cancelada'
                      AND gr.tipo_visitante = 'Institución'
                      AND LOWER(TRIM(COALESCE(inst.provincia, gr.provincia, ''))) ILIKE '%santa fe%'
                      AND COALESCE(inst.localidad, gr.localidad) IS NOT NULL AND TRIM(COALESCE(inst.localidad, gr.localidad)) != ''
                    GROUP BY COALESCE(NULLIF(TRIM(COALESCE(inst.localidad, gr.localidad)), ''), 'Sin especificar')
                    ORDER BY personas DESC
                    LIMIT 15
                `;
                const res = await pool.query(q, [fechaDesde, fechaHasta]);
                rows = res.rows;
            } else if (sec === 'inst_cruces') {
                sectionTitle = 'Instituciones con Cruce de Túnel';
                const q = `
                    SELECT
                        v.fecha,
                        gr.nombre AS grupo_nombre,
                        COALESCE(inst.localidad, gr.localidad) AS localidad,
                        COALESCE(inst.provincia, gr.provincia) AS provincia,
                        v.cantidad_personas AS personas
                    FROM Visita v
                    JOIN Grupo gr ON v.grupo_id = gr.id
                    LEFT JOIN Institucion inst ON gr.institucion_id = inst.id
                    WHERE v.fecha BETWEEN $1 AND $2
                      AND v.estado != 'Cancelada'
                      AND gr.tipo_visitante = 'Institución'
                      AND v.tiene_cruce_tunel = true
                    ORDER BY v.fecha ASC, v.hora_inicio ASC
                `;
                const res = await pool.query(q, [fechaDesde, fechaHasta]);
                rows = res.rows;
            }

            if (sec === 'inst_cruces') {
                const totalPersonas = rows.reduce((sum, r) => sum + (parseInt(r.personas) || 0), 0);
                htmlContent += `
                <div class="page">
                    <div class="header">
                        <div>
                            <h1>Túnel Subfluvial "Raúl Uranga - Carlos Sylvestre Begnis"</h1>
                            <p>Sistema de Gestión de Visitas - Informe Estadístico</p>
                        </div>
                        <div class="logo-placeholder">TÚNEL SUBFLUVIAL</div>
                    </div>

                    <div class="report-title-container">
                        <h2 class="report-title">${tituloInforme}</h2>
                        <p class="report-subtitle">Período: ${formatFecha(fechaDesde)} al ${formatFecha(fechaHasta)}</p>
                    </div>

                    <div class="section-title-container">
                        <span class="section-title">${sectionTitle}</span>
                    </div>
                `;

                if (rows.length === 0) {
                    htmlContent += `
                    <div class="empty-state">
                        No se registraron visitas para esta categoría en el período especificado.
                    </div>
                    `;
                } else {
                    htmlContent += `
                    <div style="margin-top: 15px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                            <thead>
                                <tr>
                                    <th style="background-color: #f8fafc; color: #475569; text-align: left; padding: 8px; border-bottom: 2px solid #e2e8f0; font-weight: 700;">Fecha</th>
                                    <th style="background-color: #f8fafc; color: #475569; text-align: left; padding: 8px; border-bottom: 2px solid #e2e8f0; font-weight: 700;">Institución</th>
                                    <th style="background-color: #f8fafc; color: #475569; text-align: left; padding: 8px; border-bottom: 2px solid #e2e8f0; font-weight: 700;">Localidad</th>
                                    <th style="background-color: #f8fafc; color: #475569; text-align: left; padding: 8px; border-bottom: 2px solid #e2e8f0; font-weight: 700;">Provincia</th>
                                    <th style="background-color: #f8fafc; color: #475569; text-align: right; padding: 8px; border-bottom: 2px solid #e2e8f0; font-weight: 700;">Personas</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map(r => `
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${new Date(r.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;" class="font-bold">${r.grupo_nombre}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${r.localidad || '—'}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${r.provincia || '—'}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #004a77;" class="text-right font-bold">${r.personas}</td>
                                </tr>
                                `).join('')}
                                <tr class="total-row">
                                    <td style="padding: 8px;" colspan="4">TOTAL</td>
                                    <td style="padding: 8px; color: #004a77;" class="text-right">${totalPersonas}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    `;
                }

                htmlContent += `
                    <div class="footer">
                        Página de informe estadístico - Generado ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs - ${usuarioNombre}
                    </div>
                </div>
                `;

                continue;
            }

            if (sec === 'inst_niveles') {
                const cleanRows = rows.map(r => ({
                    label: r.label,
                    visitas: parseInt(r.visitas) || 0,
                    personas: parseInt(r.personas) || 0
                }));

                const totalVisitas = cleanRows.reduce((sum, r) => sum + r.visitas, 0);
                const totalPersonas = cleanRows.reduce((sum, r) => sum + r.personas, 0);
                const maxVisitas = cleanRows.length > 0 ? Math.max(...cleanRows.map(r => r.visitas)) : 0;

                htmlContent += `
                <div class="page landscape-page">
                    <div class="header">
                        <div>
                            <h1>Túnel Subfluvial "Raúl Uranga - Carlos Sylvestre Begnis"</h1>
                            <p>Sistema de Gestión de Visitas - Informe Estadístico</p>
                        </div>
                        <div class="logo-placeholder">TÚNEL SUBFLUVIAL</div>
                    </div>

                    <div class="report-title-container">
                        <h2 class="report-title">${tituloInforme}</h2>
                        <p class="report-subtitle">Período: ${formatFecha(fechaDesde)} al ${formatFecha(fechaHasta)}</p>
                    </div>

                    <div class="section-title-container">
                        <span class="section-title">${sectionTitle}</span>
                    </div>
                `;

                if (cleanRows.length === 0) {
                    htmlContent += `
                    <div class="empty-state">
                        No se registraron visitas para esta categoría en el período especificado.
                    </div>
                    `;
                } else {
                    const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];
                    let cumulativePercent = 0;
                    const slices = cleanRows.map((r, idx) => {
                        const percent = totalPersonas > 0 ? (r.personas / totalPersonas) * 100 : 0;
                        const color = colors[idx % colors.length];
                        const start = cumulativePercent;
                        cumulativePercent += percent;
                        return {
                            label: r.label,
                            personas: r.personas,
                            percent: percent,
                            color: color,
                            start: start.toFixed(1),
                            end: cumulativePercent.toFixed(1)
                        };
                    });
                    
                    const conicGradient = slices.map(s => `${s.color} ${s.start}% ${s.end}%`).join(', ');

                    htmlContent += `
                    <div class="grid-2">
                        <div class="col-chart" style="display: flex; flex-direction: column; gap: 20px;">
                            <div>
                                <div style="font-size: 11px; font-weight: bold; color: #475569; margin-bottom: 8px;">
                                    Distribución de Visitantes (Torta)
                                </div>
                                <div class="chart-container" style="display: flex; flex-direction: row; align-items: center; padding: 15px; min-height: 140px;">
                                    <div style="width: 50%; display: flex; justify-content: center; align-items: center; flex-shrink: 0;">
                                        <div style="width: 110px; height: 110px; border-radius: 50%; background: conic-gradient(${conicGradient}); box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);"></div>
                                    </div>
                                    <div style="width: 50%; display: flex; flex-direction: column; gap: 5px; justify-content: center; padding-left: 10px;">
                                        ${slices.map(s => `
                                        <div style="display: flex; align-items: center; gap: 6px; font-size: 9px; line-height: 1.2;">
                                            <div style="width: 8px; height: 8px; border-radius: 2px; background-color: ${s.color}; flex-shrink: 0;"></div>
                                            <span style="font-weight: 600; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;" title="${s.label}">${s.label}:</span>
                                            <span style="color: #0f172a; font-weight: bold; white-space: nowrap;">${s.personas} (${s.percent.toFixed(1)}%)</span>
                                        </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div style="font-size: 11px; font-weight: bold; color: #475569; margin-bottom: 8px;">
                                    Cantidad de Grupos (Barras Verticales)
                                </div>
                                <div class="chart-container" style="padding: 15px 20px 10px 20px;">
                                    <div style="display: flex; align-items: flex-end; justify-content: space-around; height: 110px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">
                                        ${cleanRows.map((r, idx) => {
                                            const heightPct = maxVisitas > 0 ? (r.visitas / maxVisitas) * 100 : 0;
                                            const color = colors[idx % colors.length];
                                            return `
                                            <div style="display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 30px; max-width: 60px;">
                                                <span style="font-size: 8px; font-weight: bold; color: #004a77; margin-bottom: 3px;">${r.visitas}</span>
                                                <div style="height: 70px; display: flex; align-items: flex-end; width: 18px;">
                                                    <div style="width: 100%; height: ${heightPct.toFixed(1)}%; min-height: 2px; background: ${color}; border-radius: 3px 3px 0 0;"></div>
                                                </div>
                                                <span style="font-size: 8px; font-weight: 600; color: #64748b; margin-top: 5px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;" title="${r.label}">${r.label}</span>
                                            </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-table">
                            <div style="font-size: 11px; font-weight: bold; color: #475569; margin-bottom: 8px;">
                                Detalle de Datos
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>${labelHeader}</th>
                                        <th class="text-right">Visitas</th>
                                        <th class="text-right">Personas</th>
                                        <th class="text-right">% Part.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${cleanRows.map(r => {
                                        const part = totalPersonas > 0 ? ((r.personas / totalPersonas) * 100).toFixed(1) : '0.0';
                                        return `
                                        <tr>
                                            <td class="font-bold">${r.label}</td>
                                            <td class="text-right">${r.visitas}</td>
                                            <td class="text-right font-bold" style="color: #004a77;">${r.personas}</td>
                                            <td class="text-right">${part}%</td>
                                        </tr>
                                        `;
                                    }).join('')}
                                    <tr class="total-row">
                                        <td>TOTAL</td>
                                        <td class="text-right">${totalVisitas}</td>
                                        <td class="text-right" style="color: #004a77;">${totalPersonas}</td>
                                        <td class="text-right">100.0%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    `;
                }

                htmlContent += `
                    <div class="footer">
                        Página de informe estadístico - Generado ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs - ${usuarioNombre}
                    </div>
                </div>
                `;

                continue;
            }

            const cleanRows = rows.map(r => ({
                label: r.label,
                visitas: parseInt(r.visitas) || 0,
                personas: parseInt(r.personas) || 0
            }));

            const totalVisitas = cleanRows.reduce((sum, r) => sum + r.visitas, 0);
            const totalPersonas = cleanRows.reduce((sum, r) => sum + r.personas, 0);
            const maxPersonas = cleanRows.length > 0 ? Math.max(...cleanRows.map(r => r.personas)) : 0;

            htmlContent += `
            <div class="page">
                <div class="header">
                    <div>
                        <h1>Túnel Subfluvial "Raúl Uranga - Carlos Sylvestre Begnis"</h1>
                        <p>Sistema de Gestión de Visitas - Informe Estadístico</p>
                    </div>
                    <div class="logo-placeholder">TÚNEL SUBFLUVIAL</div>
                </div>

                <div class="report-title-container">
                    <h2 class="report-title">${tituloInforme}</h2>
                    <p class="report-subtitle">Período: ${formatFecha(fechaDesde)} al ${formatFecha(fechaHasta)}</p>
                </div>

                <div class="section-title-container">
                    <span class="section-title">${sectionTitle}</span>
                </div>
            `;

            if (cleanRows.length === 0) {
                htmlContent += `
                <div class="empty-state">
                    No se registraron visitas para esta categoría en el período especificado.
                </div>
                `;
            } else {
                htmlContent += `
                <div class="grid-2">
                    <div class="col-chart">
                        <div style="font-size: 11px; font-weight: bold; color: #475569; margin-bottom: 10px;">
                            Visitantes
                        </div>
                        <div class="chart-container">
                            ${cleanRows.map(r => {
                                const percentage = maxPersonas > 0 ? (r.personas / maxPersonas) * 100 : 0;
                                return `
                                <div class="chart-row">
                                    <div class="chart-label">${r.label}</div>
                                    <div class="chart-bar-wrapper">
                                        <div class="chart-bar-container">
                                            <div class="chart-bar" style="width: ${percentage}%;"></div>
                                        </div>
                                        <span class="chart-value">${r.personas}</span>
                                    </div>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    <div class="col-table">
                        <div style="font-size: 11px; font-weight: bold; color: #475569; margin-bottom: 10px;">
                            Detalle de Datos
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>${labelHeader}</th>
                                    <th class="text-right">Visitas</th>
                                    <th class="text-right">Personas</th>
                                    <th class="text-right">% Part.</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${cleanRows.map(r => {
                                    const part = totalPersonas > 0 ? ((r.personas / totalPersonas) * 100).toFixed(1) : '0.0';
                                    return `
                                    <tr>
                                        <td class="font-bold">${r.label}</td>
                                        <td class="text-right">${r.visitas}</td>
                                        <td class="text-right font-bold" style="color: #004a77;">${r.personas}</td>
                                        <td class="text-right">${part}%</td>
                                    </tr>
                                    `;
                                }).join('')}
                                <tr class="total-row">
                                    <td>TOTAL</td>
                                    <td class="text-right">${totalVisitas}</td>
                                    <td class="text-right" style="color: #004a77;">${totalPersonas}</td>
                                    <td class="text-right">100.0%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                `;
            }

            htmlContent += `
                <div class="footer">
                    Página de informe estadístico - Generado ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs - ${usuarioNombre}
                </div>
            </div>
            `;
        }

        htmlContent += `
        </body>
        </html>
        `;

        const browser = await getBrowserInstance();
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'load' });

        const pdfBuffer = await page.pdf({
            printBackground: true,
            preferCSSPageSize: true,
            margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }
        });

        await browser.close();
        return pdfBuffer;
    }
};