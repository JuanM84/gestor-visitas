import { pool } from '../config/db';

export const DiaInhabilService = {
    async obtenerTodos() {
        const result = await pool.query('SELECT id, fecha, descripcion FROM Dialnhabil ORDER BY fecha ASC');
        return result.rows;
    },

    async agregar(fecha: string, descripcion: string) {
        const result = await pool.query(
            'INSERT INTO Dialnhabil (fecha, descripcion) VALUES ($1, $2) RETURNING *',
            [fecha, descripcion]
        );
        return result.rows[0];
    },

    async eliminar(id: string) {
        await pool.query('DELETE FROM Dialnhabil WHERE id = $1', [id]);
        return true;
    }
};