import { pool } from '../config/db';

export const DiaInhabilService = {
    async obtenerTodos() {
        const result = await pool.query(
            'SELECT id, TO_CHAR(fecha, \'YYYY-MM-DD\') AS fecha, descripcion FROM DiaInhabil ORDER BY fecha ASC'
        );
        return result.rows;
    },

    async agregar(fecha: string, descripcion: string) {
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