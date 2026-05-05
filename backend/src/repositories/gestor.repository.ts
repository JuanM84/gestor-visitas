import { pool } from '../config/db';

export const GestorRepository = {
    async obtenerTodos() {
        const result = await pool.query(
            'SELECT id, nombre, tipo FROM Gestor ORDER BY nombre ASC'
        );
        return result.rows;
    }
};