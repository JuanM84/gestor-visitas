"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuarioService = void 0;
const db_1 = require("../config/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
exports.UsuarioService = {
    async obtenerTodos() {
        const query = `
            SELECT id, nombre, email, rol, activo 
            FROM Usuario 
            ORDER BY nombre ASC
        `;
        const result = await db_1.pool.query(query);
        return result.rows;
    },
    async crearUsuario(datos) {
        const existe = await db_1.pool.query('SELECT id FROM Usuario WHERE email = $1', [datos.email]);
        if (existe.rows.length > 0) {
            throw new Error('El correo electrónico ya está registrado.');
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(datos.password, salt);
        const query = `
            INSERT INTO Usuario (nombre, email, password_hash, rol) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, nombre, email, rol, activo
        `;
        const result = await db_1.pool.query(query, [
            datos.nombre,
            datos.email,
            hashedPassword,
            datos.rol || 'Guia'
        ]);
        return result.rows[0];
    }
};
