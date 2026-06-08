import { pool } from '../config/db';

export const EstadisticasService = {
    async getDashboardAdminStats(mes: number, anio: number) {
        const kpisQuery = `
            SELECT 
                COUNT(*) as total_visitas,
                COALESCE(SUM(cantidad_personas), 0) as total_personas,
                COUNT(CASE WHEN estado = 'Cancelada' THEN 1 END) as total_canceladas,
                COUNT(CASE WHEN tiene_cruce_tunel = true THEN 1 END) as total_cruces
            FROM Visita
            WHERE EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2
        `;
        const kpisResult = await pool.query(kpisQuery, [mes, anio]);
        const kpis = kpisResult.rows[0];

        const rankingQuery = `
            SELECT g.nombre, SUM(v.cantidad_personas) as total_personas, COUNT(v.id) as cantidad_visitas
            FROM Visita v
            JOIN Gestor g ON v.gestor_id = g.id
            WHERE EXTRACT(MONTH FROM v.fecha) = $1 AND EXTRACT(YEAR FROM v.fecha) = $2
              AND v.estado != 'Cancelada'
            GROUP BY g.nombre
            ORDER BY total_personas DESC
            LIMIT 5
        `;
        const rankingResult = await pool.query(rankingQuery, [mes, anio]);

        const evolucionQuery = `
            SELECT EXTRACT(DAY FROM fecha) as dia, SUM(cantidad_personas) as personas
            FROM Visita
            WHERE EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2
              AND estado != 'Cancelada'
            GROUP BY dia
            ORDER BY dia ASC
        `;
        const evolucionResult = await pool.query(evolucionQuery, [mes, anio]);

        // Distribución por tipo de visitante (Institución / Particulares)
        const distribucionTipoQuery = `
            SELECT
                gr.tipo_visitante,
                COUNT(v.id)              AS cantidad_visitas,
                SUM(v.cantidad_personas) AS total_personas
            FROM Visita v
            JOIN Grupo gr ON v.grupo_id = gr.id
            WHERE EXTRACT(MONTH FROM v.fecha) = $1
              AND EXTRACT(YEAR FROM v.fecha) = $2
              AND v.estado != 'Cancelada'
            GROUP BY gr.tipo_visitante
            ORDER BY total_personas DESC
        `;
        const distribucionTipoResult = await pool.query(distribucionTipoQuery, [mes, anio]);

        // Desglose por nivel educativo (solo Instituciones)
        const desglosePorNivelQuery = `
            SELECT
                gr.nivel_educativo,
                COUNT(v.id)              AS cantidad_visitas,
                SUM(v.cantidad_personas) AS total_personas
            FROM Visita v
            JOIN Grupo gr ON v.grupo_id = gr.id
            WHERE EXTRACT(MONTH FROM v.fecha) = $1
              AND EXTRACT(YEAR FROM v.fecha) = $2
              AND v.estado != 'Cancelada'
              AND gr.tipo_visitante = 'Institución'
              AND gr.nivel_educativo IS NOT NULL
            GROUP BY gr.nivel_educativo
            ORDER BY total_personas DESC
        `;
        const desglosePorNivelResult = await pool.query(desglosePorNivelQuery, [mes, anio]);

        // Desglose por provincia argentina
        const desglosePorProvinciaQuery = `
            SELECT
                COALESCE(NULLIF(TRIM(gr.provincia), ''), 'Sin especificar') AS provincia,
                COUNT(v.id)              AS cantidad_visitas,
                SUM(v.cantidad_personas) AS total_personas
            FROM Visita v
            JOIN Grupo gr ON v.grupo_id = gr.id
            WHERE EXTRACT(MONTH FROM v.fecha) = $1
              AND EXTRACT(YEAR FROM v.fecha) = $2
              AND v.estado != 'Cancelada'
              AND UPPER(TRIM(COALESCE(gr.pais, ''))) IN ('ARGENTINA', '')
              AND gr.provincia IS NOT NULL AND TRIM(gr.provincia) != ''
            GROUP BY provincia
            ORDER BY total_personas DESC
            LIMIT 15
        `;
        const desglosePorProvinciaResult = await pool.query(desglosePorProvinciaQuery, [mes, anio]);

        // Localidades de Entre Ríos
        const localidadesEntreRiosQuery = `
            SELECT
                COALESCE(NULLIF(TRIM(gr.localidad), ''), 'Sin especificar') AS localidad,
                COUNT(v.id)              AS cantidad_visitas,
                SUM(v.cantidad_personas) AS total_personas
            FROM Visita v
            JOIN Grupo gr ON v.grupo_id = gr.id
            WHERE EXTRACT(MONTH FROM v.fecha) = $1
              AND EXTRACT(YEAR FROM v.fecha) = $2
              AND v.estado != 'Cancelada'
              AND LOWER(TRIM(COALESCE(gr.provincia, ''))) ILIKE '%entre r%'
              AND gr.localidad IS NOT NULL AND TRIM(gr.localidad) != ''
            GROUP BY localidad
            ORDER BY total_personas DESC
            LIMIT 20
        `;
        const localidadesEntreRiosResult = await pool.query(localidadesEntreRiosQuery, [mes, anio]);

        // Localidades de Santa Fe
        const localidadesSantaFeQuery = `
            SELECT
                COALESCE(NULLIF(TRIM(gr.localidad), ''), 'Sin especificar') AS localidad,
                COUNT(v.id)              AS cantidad_visitas,
                SUM(v.cantidad_personas) AS total_personas
            FROM Visita v
            JOIN Grupo gr ON v.grupo_id = gr.id
            WHERE EXTRACT(MONTH FROM v.fecha) = $1
              AND EXTRACT(YEAR FROM v.fecha) = $2
              AND v.estado != 'Cancelada'
              AND LOWER(TRIM(COALESCE(gr.provincia, ''))) ILIKE '%santa fe%'
              AND gr.localidad IS NOT NULL AND TRIM(gr.localidad) != ''
            GROUP BY localidad
            ORDER BY total_personas DESC
            LIMIT 20
        `;
        const localidadesSantaFeResult = await pool.query(localidadesSantaFeQuery, [mes, anio]);

        // Origen: Argentina vs. Extranjeros
        const origenQuery = `
            SELECT
                CASE
                    WHEN UPPER(TRIM(COALESCE(gr.pais, 'ARGENTINA'))) = 'ARGENTINA' OR TRIM(COALESCE(gr.pais, '')) = ''
                    THEN 'Argentina'
                    ELSE 'Extranjeros'
                END AS origen,
                COUNT(v.id)              AS cantidad_visitas,
                SUM(v.cantidad_personas) AS total_personas
            FROM Visita v
            JOIN Grupo gr ON v.grupo_id = gr.id
            WHERE EXTRACT(MONTH FROM v.fecha) = $1
              AND EXTRACT(YEAR FROM v.fecha) = $2
              AND v.estado != 'Cancelada'
            GROUP BY origen
            ORDER BY total_personas DESC
        `;
        const origenResult = await pool.query(origenQuery, [mes, anio]);

        return {
            kpis: {
                visitas: parseInt(kpis.total_visitas),
                personas: parseInt(kpis.total_personas),
                canceladas: parseInt(kpis.total_canceladas),
                cruces: parseInt(kpis.total_cruces)
            },
            rankingGestores: rankingResult.rows,
            evolucion: evolucionResult.rows,
            distribucionTipo: distribucionTipoResult.rows,
            desglosePorNivel: desglosePorNivelResult.rows,
            desglosePorProvincia: desglosePorProvinciaResult.rows,
            localidadesEntreRios: localidadesEntreRiosResult.rows,
            localidadesSantaFe: localidadesSantaFeResult.rows,
            origenVisitantes: origenResult.rows
        };
    },

    async getStatsByRango(fechaDesde: string, fechaHasta: string) {
        const kpisQuery = `
            SELECT
                COUNT(*) as total_visitas,
                COALESCE(SUM(cantidad_personas), 0) as total_personas,
                COUNT(CASE WHEN estado = 'Cancelada' THEN 1 END) as total_canceladas,
                COUNT(CASE WHEN tiene_cruce_tunel = true THEN 1 END) as total_cruces
            FROM Visita
            WHERE fecha BETWEEN $1 AND $2
        `;
        const kpisResult = await pool.query(kpisQuery, [fechaDesde, fechaHasta]);
        const kpis = kpisResult.rows[0];

        const rankingQuery = `
            SELECT g.nombre, SUM(v.cantidad_personas) as total_personas, COUNT(v.id) as cantidad_visitas
            FROM Visita v
            JOIN Gestor g ON v.gestor_id = g.id
            WHERE v.fecha BETWEEN $1 AND $2
              AND v.estado != 'Cancelada'
            GROUP BY g.nombre
            ORDER BY total_personas DESC
            LIMIT 5
        `;
        const rankingResult = await pool.query(rankingQuery, [fechaDesde, fechaHasta]);

        const evolucionQuery = `
            SELECT TO_CHAR(fecha, 'DD/MM') as dia, SUM(cantidad_personas) as personas
            FROM Visita
            WHERE fecha BETWEEN $1 AND $2
              AND estado != 'Cancelada'
            GROUP BY fecha
            ORDER BY fecha ASC
        `;
        const evolucionResult = await pool.query(evolucionQuery, [fechaDesde, fechaHasta]);

        const distribucionTipoQuery = `
            SELECT
                gr.tipo_visitante,
                COUNT(v.id)              AS cantidad_visitas,
                SUM(v.cantidad_personas) AS total_personas
            FROM Visita v
            JOIN Grupo gr ON v.grupo_id = gr.id
            WHERE v.fecha BETWEEN $1 AND $2
              AND v.estado != 'Cancelada'
            GROUP BY gr.tipo_visitante
            ORDER BY total_personas DESC
        `;
        const distribucionTipoResult = await pool.query(distribucionTipoQuery, [fechaDesde, fechaHasta]);

        const desglosePorNivelQuery = `
            SELECT
                gr.nivel_educativo,
                COUNT(v.id)              AS cantidad_visitas,
                SUM(v.cantidad_personas) AS total_personas
            FROM Visita v
            JOIN Grupo gr ON v.grupo_id = gr.id
            WHERE v.fecha BETWEEN $1 AND $2
              AND v.estado != 'Cancelada'
              AND gr.tipo_visitante = 'Institución'
              AND gr.nivel_educativo IS NOT NULL
            GROUP BY gr.nivel_educativo
            ORDER BY total_personas DESC
        `;
        const desglosePorNivelResult = await pool.query(desglosePorNivelQuery, [fechaDesde, fechaHasta]);

        // Desglose por provincia argentina
        const desglosePorProvinciaQuery = `
            SELECT
                COALESCE(NULLIF(TRIM(gr.provincia), ''), 'Sin especificar') AS provincia,
                COUNT(v.id)              AS cantidad_visitas,
                SUM(v.cantidad_personas) AS total_personas
            FROM Visita v
            JOIN Grupo gr ON v.grupo_id = gr.id
            WHERE v.fecha BETWEEN $1 AND $2
              AND v.estado != 'Cancelada'
              AND UPPER(TRIM(COALESCE(gr.pais, ''))) IN ('ARGENTINA', '')
              AND gr.provincia IS NOT NULL AND TRIM(gr.provincia) != ''
            GROUP BY provincia
            ORDER BY total_personas DESC
            LIMIT 15
        `;
        const desglosePorProvinciaResult = await pool.query(desglosePorProvinciaQuery, [fechaDesde, fechaHasta]);

        // Localidades de Entre Ríos
        const localidadesEntreRiosQuery = `
            SELECT
                COALESCE(NULLIF(TRIM(gr.localidad), ''), 'Sin especificar') AS localidad,
                COUNT(v.id)              AS cantidad_visitas,
                SUM(v.cantidad_personas) AS total_personas
            FROM Visita v
            JOIN Grupo gr ON v.grupo_id = gr.id
            WHERE v.fecha BETWEEN $1 AND $2
              AND v.estado != 'Cancelada'
              AND LOWER(TRIM(COALESCE(gr.provincia, ''))) ILIKE '%entre r%'
              AND gr.localidad IS NOT NULL AND TRIM(gr.localidad) != ''
            GROUP BY localidad
            ORDER BY total_personas DESC
            LIMIT 20
        `;
        const localidadesEntreRiosResult = await pool.query(localidadesEntreRiosQuery, [fechaDesde, fechaHasta]);

        // Localidades de Santa Fe
        const localidadesSantaFeQuery = `
            SELECT
                COALESCE(NULLIF(TRIM(gr.localidad), ''), 'Sin especificar') AS localidad,
                COUNT(v.id)              AS cantidad_visitas,
                SUM(v.cantidad_personas) AS total_personas
            FROM Visita v
            JOIN Grupo gr ON v.grupo_id = gr.id
            WHERE v.fecha BETWEEN $1 AND $2
              AND v.estado != 'Cancelada'
              AND LOWER(TRIM(COALESCE(gr.provincia, ''))) ILIKE '%santa fe%'
              AND gr.localidad IS NOT NULL AND TRIM(gr.localidad) != ''
            GROUP BY localidad
            ORDER BY total_personas DESC
            LIMIT 20
        `;
        const localidadesSantaFeResult = await pool.query(localidadesSantaFeQuery, [fechaDesde, fechaHasta]);

        // Origen: Argentina vs. Extranjeros
        const origenQuery = `
            SELECT
                CASE
                    WHEN UPPER(TRIM(COALESCE(gr.pais, 'ARGENTINA'))) = 'ARGENTINA' OR TRIM(COALESCE(gr.pais, '')) = ''
                    THEN 'Argentina'
                    ELSE 'Extranjeros'
                END AS origen,
                COUNT(v.id)              AS cantidad_visitas,
                SUM(v.cantidad_personas) AS total_personas
            FROM Visita v
            JOIN Grupo gr ON v.grupo_id = gr.id
            WHERE v.fecha BETWEEN $1 AND $2
              AND v.estado != 'Cancelada'
            GROUP BY origen
            ORDER BY total_personas DESC
        `;
        const origenResult = await pool.query(origenQuery, [fechaDesde, fechaHasta]);

        return {
            kpis: {
                visitas: parseInt(kpis.total_visitas),
                personas: parseInt(kpis.total_personas),
                canceladas: parseInt(kpis.total_canceladas),
                cruces: parseInt(kpis.total_cruces)
            },
            rankingGestores: rankingResult.rows,
            evolucion: evolucionResult.rows,
            distribucionTipo: distribucionTipoResult.rows,
            desglosePorNivel: desglosePorNivelResult.rows,
            desglosePorProvincia: desglosePorProvinciaResult.rows,
            localidadesEntreRios: localidadesEntreRiosResult.rows,
            localidadesSantaFe: localidadesSantaFeResult.rows,
            origenVisitantes: origenResult.rows
        };
    }
};