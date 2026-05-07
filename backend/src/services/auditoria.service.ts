import { pool } from '../config/db';

export const AuditoriaService = {
    async obtenerLogs(limite: number = 100) {
        const query = `
            SELECT 
                l.id,
                l.accion,
                l.created_at as fecha,
                u.email as usuario_email,
                u.rol as usuario_rol
            FROM LogAuditoria l
            LEFT JOIN Usuario u ON l.usuario_id = u.id
            ORDER BY l.created_at DESC
            LIMIT $1
        `;

        const result = await pool.query(query, [limite]);
        return result.rows;
    }
};