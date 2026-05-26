"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiaInhabilService = void 0;
const db_1 = require("../config/db");
exports.DiaInhabilService = {
    async obtenerTodos() {
        const result = await db_1.pool.query('SELECT id, TO_CHAR(fecha, \'YYYY-MM-DD\') AS fecha, descripcion FROM DiaInhabil ORDER BY fecha ASC');
        return result.rows;
    },
    async agregar(fecha, descripcion) {
        const result = await db_1.pool.query('INSERT INTO DiaInhabil (fecha, descripcion) VALUES ($1, $2) RETURNING id, TO_CHAR(fecha, \'YYYY-MM-DD\') AS fecha, descripcion', [fecha, descripcion]);
        return result.rows[0];
    },
    async eliminar(id) {
        await db_1.pool.query('DELETE FROM DiaInhabil WHERE id = $1', [id]);
        return true;
    }
};
