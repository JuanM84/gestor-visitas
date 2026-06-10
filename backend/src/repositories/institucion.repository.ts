import { pool } from '../config/db';

export const InstitucionRepository = {
    async findAll() {
        const result = await pool.query(
            'SELECT id, nombre, telefono, email, localidad, provincia, pais FROM Institucion ORDER BY nombre ASC'
        );
        return result.rows;
    },

    async findById(id: string) {
        const result = await pool.query(
            'SELECT * FROM Institucion WHERE id = $1',
            [id]
        );
        return result.rows[0];
    },

    async create(datos: any, client?: any) {
        const query = `
            INSERT INTO Institucion (nombre, telefono, email, localidad, provincia, pais)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const executor = client || pool;
        const result = await executor.query(query, [
            datos.nombre,
            datos.telefono || null,
            datos.email || null,
            datos.localidad || null,
            datos.provincia || null,
            datos.pais || 'Argentina'
        ]);
        return result.rows[0];
    }
};
