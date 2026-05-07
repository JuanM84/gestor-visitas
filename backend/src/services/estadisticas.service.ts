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

        return {
            kpis: {
                visitas: parseInt(kpis.total_visitas),
                personas: parseInt(kpis.total_personas),
                canceladas: parseInt(kpis.total_canceladas),
                cruces: parseInt(kpis.total_cruces)
            },
            rankingGestores: rankingResult.rows,
            evolucion: evolucionResult.rows
        };
    }
};