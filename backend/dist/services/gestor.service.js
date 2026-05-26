"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GestorService = void 0;
const db_1 = require("../config/db");
exports.GestorService = {
    async obtenerTodos() {
        const query = `
            SELECT id, nombre, tipo, empresa_institucion, telefono, email, localidad, provincia, pais 
            FROM Gestor 
            ORDER BY nombre ASC
        `;
        const result = await db_1.pool.query(query);
        return result.rows;
    },
    async crearGestor(datos) {
        const query = `
            INSERT INTO Gestor (nombre, tipo, empresa_institucion, telefono, email, localidad, provincia, pais) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *
        `;
        const result = await db_1.pool.query(query, [
            datos.nombre,
            datos.tipo || 'Institución Educativa',
            datos.empresa_institucion || null,
            datos.telefono || null,
            datos.email || null,
            datos.localidad || null,
            datos.provincia || null,
            datos.pais || 'Argentina'
        ]);
        return result.rows[0];
    }
};
