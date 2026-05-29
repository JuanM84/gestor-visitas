import { pool } from '../config/db';

export const DiaInhabilService = {
    async obtenerTodos() {
        const result = await pool.query(
            'SELECT id, TO_CHAR(fecha, \'YYYY-MM-DD\') AS fecha, descripcion FROM DiaInhabil ORDER BY fecha ASC'
        );
        return result.rows;
    },

    async agregar(fecha: string, descripcion: string) {
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

        const result = await pool.query(
            'INSERT INTO DiaInhabil (fecha, descripcion) VALUES ($1, $2) RETURNING id, TO_CHAR(fecha, \'YYYY-MM-DD\') AS fecha, descripcion',
            [fecha, descripcion]
        );
        return result.rows[0];
    },

    async eliminar(id: string) {
        await pool.query('DELETE FROM DiaInhabil WHERE id = $1', [id]);
        return true;
    }
};