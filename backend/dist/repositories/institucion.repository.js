"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstitucionRepository = void 0;
const db_1 = require("../config/db");
exports.InstitucionRepository = {
    async findAll() {
        const result = await db_1.pool.query('SELECT id, nombre, telefono, email, localidad, provincia, pais FROM Institucion ORDER BY nombre ASC');
        return result.rows;
    },
    async findById(id) {
        const result = await db_1.pool.query('SELECT * FROM Institucion WHERE id = $1', [id]);
        return result.rows[0];
    },
    async create(datos) {
        const query = `
            INSERT INTO Institucion (nombre, telefono, email, localidad, provincia, pais)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const result = await db_1.pool.query(query, [
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
