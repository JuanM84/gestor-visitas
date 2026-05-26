"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const db_1 = require("../config/db");
exports.AuthRepository = {
    async buscarUsuarioPorEmail(email) {
        const result = await db_1.pool.query('SELECT id, nombre, email, password_hash, rol, activo FROM Usuario WHERE email = $1', [email]);
        return result.rows[0];
    }
};
