"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GestorRepository = void 0;
const db_1 = require("../config/db");
exports.GestorRepository = {
    async obtenerTodos() {
        const result = await db_1.pool.query('SELECT id, nombre, empresa_institucion, telefono, email, localidad, provincia, pais FROM Gestor ORDER BY nombre ASC');
        return result.rows;
    }
};
