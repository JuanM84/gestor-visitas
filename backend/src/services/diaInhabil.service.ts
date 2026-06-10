import { pool } from '../config/db';

export const DiaInhabilService = {
    async obtenerTodos() {
        const result = await pool.query(
            'SELECT id, TO_CHAR(fecha, \'YYYY-MM-DD\') AS fecha, descripcion FROM DiaInhabil ORDER BY fecha ASC'
        );
        return result.rows;
    },

    async agregar(fecha: string, descripcion: string, usuarioId?: string) {
        // C-3: Validar que la fecha no sea pasada
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaObj = new Date(fecha + 'T12:00:00');
        if (fechaObj < hoy) {
            throw new Error('No se puede bloquear una fecha pasada');
        }

        // C-4: Validar que no esté ya registrada
        const existe = await pool.query(
            'SELECT id FROM DiaInhabil WHERE fecha::date = $1::date',
            [fecha]
        );
        if (existe.rows.length > 0) {
            throw new Error('Esta fecha ya está registrada como día inhábil');
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await client.query(
                'INSERT INTO DiaInhabil (fecha, descripcion) VALUES ($1, $2) RETURNING id, TO_CHAR(fecha, \'YYYY-MM-DD\') AS fecha, descripcion',
                [fecha, descripcion]
            );

            if (usuarioId) {
                const parts = fecha.split('-');
                const fechaLegible = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : fecha;
                await client.query(
                    `INSERT INTO LogAuditoria (usuario_id, accion) VALUES ($1, $2)`,
                    [usuarioId, `Bloqueó el día ${fechaLegible} ("${descripcion}")`]
                );
            }

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async eliminar(id: string, usuarioId?: string) {
        const existe = await pool.query("SELECT TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha, descripcion FROM DiaInhabil WHERE id = $1", [id]);
        if (existe.rows.length === 0) {
            throw new Error('El día inhábil no existe');
        }
        const fecha = existe.rows[0].fecha;
        const descripcion = existe.rows[0].descripcion;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM DiaInhabil WHERE id = $1', [id]);

            if (usuarioId) {
                const parts = fecha.split('-');
                const fechaLegible = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : fecha;
                await client.query(
                    `INSERT INTO LogAuditoria (usuario_id, accion) VALUES ($1, $2)`,
                    [usuarioId, `Desbloqueó el día ${fechaLegible} ("${descripcion}")`]
                );
            }

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
};